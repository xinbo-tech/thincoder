/**
 * abort-provenance.test.mjs — 第 24 批（子代理 abort 来源标注——可诊断性）测试用例表：
 * T-AP1–T-AP8。
 *
 * T-AP8（既有 abort / 结算 / 取消五族全绿 = N-D1.1 零回归）判定 = 命令级：
 *   node --test test/sync-cancel.test.mjs test/async-settle.test.mjs test/queued-stop.test.mjs \
 *     test/subagent-observe-send.test.mjs test/advisor-chain-guards.test.mjs
 * 本档承载其判定面的纯单元部分（新错误对象仍命中既有谓词——误伤即红），全族实跑见交付记录。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import {
  TRIGGERS, triggerOf, abortError, timeoutError, annotateAbort, deathLine,
} from "@thincoder/core/abort-provenance.mjs"
import { classifySyncAbort, armSyncChildAbort } from "@thincoder/core/agent-tools/subagent.mjs"

test("T-AP1 词汇表：triggerOf 四形态 + TRIGGERS 计数 5（F-D1.1）", () => {
  assert.equal(TRIGGERS.length, 5)
  assert.deepEqual([...TRIGGERS].sort(), ["cancel", "stop", "timeout", "unknown", "user"])
  // ① {interrupt:true(,message)}（既有 user 面）
  assert.equal(triggerOf({ reason: { interrupt: true } }), "user")
  assert.equal(triggerOf({ reason: { interrupt: true, message: "ctrl-i" } }), "user")
  // ② TimeoutError（原生——timeout 面）
  assert.equal(triggerOf({ reason: Object.assign(new Error("t"), { name: "TimeoutError" }) }), "timeout")
  // ③ {abortTrigger:"cancel"|"stop"|"timeout"}
  assert.equal(triggerOf({ reason: { abortTrigger: "cancel" } }), "cancel")
  assert.equal(triggerOf({ reason: { abortTrigger: "stop" } }), "stop")
  assert.equal(triggerOf({ reason: { abortTrigger: "timeout" } }), "timeout")
  // ④ 缺失 / 无已知键（裸 abort() 的 DOMException）→ unknown（告警态，不得静默）
  assert.equal(triggerOf({ reason: undefined }), "unknown")
  assert.equal(triggerOf({ reason: "boom" }), "unknown")
  const bare = new AbortController()
  bare.abort()
  assert.equal(triggerOf(bare.signal), "unknown")
  assert.equal(triggerOf(null), "unknown")
})

test("T-AP2 hop 保 reason：base.abort({interrupt,message}) → 子 ctrl 深等（F-D1.2）", () => {
  const parent = { _syncChildAborts: new Map() }
  const base = new AbortController()
  const { ctrl } = armSyncChildAbort(parent, "coder#1", base.signal)
  const reason = { interrupt: true, message: "ctrl-i" }
  base.abort(reason)
  assert.equal(ctrl.signal.aborted, true)
  // fail-when-unchanged：裸 ctrl.abort() 下 reason = 无名 DOMException ≠ 基 reason
  assert.deepEqual(ctrl.signal.reason, reason)
  assert.equal(ctrl.signal.reason, base.signal.reason)
  // already-aborted base（spawn 装配窗口内已停）——同样逐跳透传
  const pre = new AbortController()
  const reason2 = { abortTrigger: "stop", abortDetail: "session-stop" }
  pre.abort(reason2)
  const { ctrl: ctrl2 } = armSyncChildAbort({ _syncChildAborts: new Map() }, "coder#2", pre.signal)
  assert.deepEqual(ctrl2.signal.reason, reason2)
})

test("T-AP3 死亡行合成：原 message 前缀逐字 + 来源后缀（F-D1.3）", () => {
  const ctrl = new AbortController()
  ctrl.abort({ interrupt: true, message: "x" })
  const e = abortError(ctrl.signal, "provider", "stream-read")
  assert.deepEqual(e.abortInfo, { trigger: "user", layer: "provider", detail: "stream-read" })
  assert.equal(e.name, "AbortError")
  assert.deepEqual(e.reason, { interrupt: true, message: "x" })
  const line = deathLine(e, ctrl.signal)
  assert.ok(line.startsWith("The operation was aborted"), line) // 前缀逐字（既有断言零回归）
  assert.ok(line.includes("· abort(user@provider:stream-read)"), line)
  // 无 abort 特征 → 零后缀（message 直通——既有文案零回归）
  assert.equal(deathLine(new Error("plain boom"), null), "plain boom")
  // ≤300 字符（超长优先截 detail）
  const cap = deathLine(abortError(ctrl.signal, "provider", "z".repeat(500)), ctrl.signal)
  assert.ok(cap.length <= 300, String(cap.length))
  // 防御形态：非串 detail（自由短串契约外）不崩——归一化渲染
  assert.ok(deathLine(abortError(ctrl.signal, "provider", 42), ctrl.signal).includes("· abort(user@provider:42)"))
})

test("T-AP4 unknown 显式告警：无来源信号的死亡不得静默（F-D1.4）", () => {
  const bare = new AbortController()
  bare.abort()
  // 已标注但 reason 缺失（产生点兜底）——unknown 形态逐字用告警 token
  const annotated = deathLine(abortError(bare.signal, "provider", "stream-read"), bare.signal)
  assert.ok(annotated.includes("· abort(unknown@provider:no reason on signal)"), annotated)
  // 完全未标注（undici 直透形态）→ unknown + layer 回落 unrecorded
  const raw = Object.assign(new Error("The operation was aborted"), { name: "AbortError" })
  const line = deathLine(raw, bare.signal)
  assert.ok(line.includes("· abort(unknown@unrecorded:no reason on signal)"), line)
  assert.notEqual(line, raw.message) // 空后缀即红
})

test("T-AP5 定时器面两形态：timeoutError 合成 + reason 载荷 timeout（F-D1.1/F-D1.3）", () => {
  // ① 错误面（读侧 idle / proxy 定时器）
  const e = timeoutError("SSE idle timeout: no data for 120s", "provider", "sse-idle")
  assert.equal(e.name, "Error") // 既有分类谓词零变化（name 不升级为 TimeoutError）
  assert.deepEqual(e.abortInfo, { trigger: "timeout", layer: "provider", detail: "sse-idle" })
  const line = deathLine(e, null)
  assert.ok(line.startsWith("SSE idle timeout: no data for 120s"), line)
  assert.ok(line.includes("· abort(timeout@provider:sse-idle)"), line)
  // ② 信号面（consult watchdog——timer 中止 ctrl 的 reason 载荷）
  const ctrl = new AbortController()
  ctrl.abort({ abortTrigger: "timeout", abortDetail: "consult-watchdog" })
  assert.equal(triggerOf(ctrl.signal), "timeout")
  assert.ok(deathLine(abortError(ctrl.signal, "provider", "watchdog"), ctrl.signal).includes("· abort(timeout@provider:watchdog)"))
})

test("T-AP6 cause 链渲染（P1）：网络死亡真因同判（F-D1.3）", () => {
  const e = Object.assign(new Error("fetch failed"), { cause: new Error("HeadersTimeoutError") })
  const line = deathLine(e, null)
  assert.ok(line.includes("← cause:"), line)
  assert.ok(line.includes("HeadersTimeoutError"), line)
  assert.equal(deathLine(Object.assign(new Error("no cause"), {}), null), "no cause")
})

test("T-AP7 取消 / 停止站点：reason 载荷 → 死亡行分类 + annotateAbort 契约（F-D1.1）", () => {
  const c = new AbortController()
  c.abort({ abortTrigger: "cancel", abortDetail: "subagent-cancel" })
  assert.ok(deathLine(abortError(c.signal, "settle", "sync-stopped"), c.signal).includes("· abort(cancel@settle:sync-stopped)"))
  const s = new AbortController()
  s.abort({ abortTrigger: "stop", abortDetail: "session-stop" })
  assert.ok(deathLine(abortError(s.signal, "agent", "post-chat"), s.signal).includes("· abort(stop@agent:post-chat)"))
  // 未标注 + 信号带 abortDetail（形态③）——站点名仍可辨（detail 回落）
  const un = Object.assign(new Error("The operation was aborted"), { name: "AbortError" })
  assert.ok(deathLine(un, c.signal).includes("· abort(cancel@unrecorded:subagent-cancel)"))
  // annotateAbort：缺 abortInfo 才补；不改 name / message
  const raw = Object.assign(new Error("This operation was aborted"), { name: "AbortError" })
  assert.equal(annotateAbort(raw, c.signal, "provider", "request"), raw)
  assert.equal(raw.name, "AbortError")
  assert.equal(raw.message, "This operation was aborted")
  assert.deepEqual(raw.abortInfo, { trigger: "cancel", layer: "provider", detail: "request" })
  // 已标注不覆盖（产生点优先——err-first 求值链）
  const keep = abortError(c.signal, "provider", "stream-read")
  assert.equal(annotateAbort(keep, s.signal, "agent", "x"), keep)
  assert.deepEqual(keep.abortInfo, { trigger: "cancel", layer: "provider", detail: "stream-read" })
})

test("T-AP8 零回归判定面：新错误对象仍命中既有谓词（N-D1.1——五族实跑见交付记录）", () => {
  const ctrl = new AbortController()
  ctrl.abort({ abortTrigger: "cancel", abortDetail: "sync-child-cancel" })
  const err = abortError(ctrl.signal, "settle", "sync-stopped")
  // classifySyncAbort（SYNC-CANCEL ② 折叠）：AbortError + 自属 ctrl aborted → targeted 语义不变
  const sig = (aborted) => ({ aborted })
  assert.equal(classifySyncAbort(sig(false), sig(false), ctrl.signal, err), "targeted")
  // 形态③不含 interrupt 键（§20.3 第 1 条末——既有 {interrupt} 判据点零触碰）
  assert.equal(ctrl.signal.reason.interrupt, undefined)
  assert.equal(timeoutError("x", "provider", "t").name, "Error")
})
