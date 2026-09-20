/**
 * digest-end-line.test.mjs — X9（2026-09-20 端差·显示面消差批 批 3）用例：CLI 消化轮可见
 * 收尾行（`已消化 N 份后台报告（Xs）` 的英文字面 / 中断形态）——对位 VSC `webview/chat.js`
 * `showDigestStatus` 的 digest end 面。口径：① 计数 = **起跑数**（`pend0`——与 VSC
 * `suspension.mjs` 起跑 post 同源）；② 文案单源 = 核 i18n `digest.done` / `digest.aborted`
 * （本档断言以核容器值正则化为据，不复制字面常量）；③ 中断/失败 ⇒ aborted 形态。
 * F-UC8（2026-09-21 信号提示行批 · §6.27.12.13 ①–③ / ⑦）：起跑标签**按因两档**（T-SL-C1
 * 四格矩阵——AUTO 与 manual 同判）+ **起跑数行**（T-SL-C2）+ ask-only 轮零收尾行
 * （T-SL-C3——起跑行与收尾行同守 `pend0 > 0`）。
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

test("T-SL-C1 正常·CLI 四格矩阵（manual / AUTO × ask / digest——§6.27.12.13 ①）：字面 = 核容器值（ask 档携「谁 + 啥」）；AUTO 两格与 manual 逐字同", async () => {
  const ASK_LABEL = t("digest.turnLabelAsk", { from: "coder#1", msg: "in-flight ask" }, "en")
  const DIGEST_LABEL = t("digest.turnLabel", {}, "en")
  // ① manual × digest（既有字面零改）
  const m1 = rig({ entries: 1 })
  await suspensionSession(m1.ctx)
  assert.equal(m1.lines[0], DIGEST_LABEL, `manual × digest（实读：${m1.lines[0]}）`)
  // ② manual × ask（携参——核单点 `upstreamAskLabelVars`）
  const m2 = rig({ entries: 1, upstream: true })
  await suspensionSession(m2.ctx)
  assert.equal(m2.lines[0], ASK_LABEL, `manual × ask 携「谁 + 啥」（实读：${m2.lines[0]}）`)
  // ③ AUTO × digest（与 ① 逐字同——泛句退场：无生产者）
  const a1 = rig({ entries: 1, auto: true })
  await suspensionSession(a1.ctx)
  assert.equal(a1.lines[0], DIGEST_LABEL, `AUTO × digest 与 manual 逐字同（实读：${a1.lines[0]}）`)
  assert.ok(!a1.lines.some((l) => l.includes("continuing background work")), "AUTO 泛句零生产者（键已退场）")
  // ④ AUTO × ask（与 ② 逐字同）
  const a2 = rig({ entries: 1, auto: true, upstream: true })
  await suspensionSession(a2.ctx)
  assert.equal(a2.lines[0], ASK_LABEL, `AUTO × ask 与 manual 逐字同（实读：${a2.lines[0]}）`)
})

test("T-SL-C2 正常·CLI 起跑数行（对位 VSC `.digest-status`——§6.27.12.13 ③）：digest 轮标签后起跑行携起跑数；ask-only 轮（`pend0 = 0`）零起跑行（`n > 0` 规则）", async () => {
  const START2 = lineRe("digest.start", { n: "2" })
  const a = rig({ entries: 2 })
  await suspensionSession(a.ctx)
  assert.equal(a.lines[0], t("digest.turnLabel", {}, "en"), `标签行在前（实读：${a.lines[0]}）`)
  assert.ok(START2.test(a.lines[1] ?? ""), `起跑行紧随标签（起跑数 n = 2——实读：${a.lines[1]}）`)
  assert.equal(a.lines.filter((l) => START2.test(l)).length, 1, "首轮一条起跑行（次轮起跑数 1——逐轮各一条）")
  // ask-only 轮：无 pending ⇒ `pend0 = 0` ⇒ 零起跑行（与收尾行同守卫——幻影行禁出）
  const b = rig({ entries: 0, upstream: true })
  await suspensionSession(b.ctx)
  assert.equal(b.rounds(), 1, "ask-only 轮恰开一轮（drain 后自然退出）")
  assert.equal(b.lines.length, 1, `零起跑行（实读：${JSON.stringify(b.lines)}）`)
})

test("T-SL-C3 正常 + 边界·CLI ask-only 轮零收尾行（`pend0 > 0` 守卫——§6.27.12.13 ③）：done / aborted 两形态同判；对照态（`pend0 > 0`）收尾行在场（零回归）", async () => {
  // ① ask-only 轮（`upstream` + 零 pending ⇒ `pend0 = 0`）：零 done 收尾行
  const askOnly = rig({ entries: 0, upstream: true })
  await suspensionSession(askOnly.ctx)
  assert.equal(
    askOnly.lines.filter((l) => DONE1.test(l) || DONE2.test(l)).length, 0,
    `零 done 收尾行（实读：${JSON.stringify(askOnly.lines)}）`,
  )
  assert.ok(askOnly.lines[0]?.includes("answering coder#1"), "标签行仍在场（可见面零回归）")
  // ② 同形 + 首轮停（aborted 形态）：仍零收尾行（两形态同判——守卫先于 ok 判）
  const abortedAsk = rig({ entries: 0, upstream: true, abortFirst: true })
  await suspensionSession(abortedAsk.ctx)
  assert.equal(
    abortedAsk.lines.filter((l) => ABORTED.test(l)).length, 0,
    `ask-only 中断轮零 aborted 收尾行（实读：${JSON.stringify(abortedAsk.lines)}）`,
  )
  // ③ 对照：`pend0 > 0` ⇒ 收尾行在场（既有形态零回归——与首条 X9 用例同源）
  const ctl = rig({ entries: 2 })
  await suspensionSession(ctl.ctx)
  assert.equal(ctl.lines.filter((l) => DONE1.test(l) || DONE2.test(l)).length, 2, "对照态两轮各一条收尾行")
})
