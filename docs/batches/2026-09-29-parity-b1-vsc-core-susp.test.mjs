/**
 * 2026-09-29-parity-b1-vsc-core-susp.test.mjs — 批次本地单元件（parity-b1 · VSC+CLI 收口核 · 随批留存归档）。
 * 拆自 `2026-09-29-parity-b1-vsc-core.test.mjs`（#788 批内件挂载面归一——拆分计划 §2.11「先拆后改」；断言逐字迁移）。
 * 覆盖 = G3 挂起状态机（P3：step1–4 序 ∕ 退出清场 ∕ 残输入 ∕ abort 只清已死 + 核增补 C ∕ D 全用例）。
 * 名随批次档 · 住批次目录 · 不进仓套件；复跑 = 从仓库根 `thincoder/`：
 *   node --test docs/batches/2026-09-29-parity-b1-vsc-core-susp.test.mjs
 */
import test from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { registerHooks } from "node:module"

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-core"))) throw new Error(`须从仓库根（thincoder/）运行——cwd = ${ROOT}`)
const HERE = fileURLToPath(import.meta.url)


const mod = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
/** 挂起驱动等待中反复唤醒直至条件成立（缺省 wait 窗已过 ⇒ 唤醒丢失时的鲁棒驱动）。 */
const wakeUntil = async (h, cond, ms = 3000) => {
  const t0 = Date.now()
  while (!cond()) {
    if (Date.now() - t0 > ms) throw new Error("wakeUntil timeout")
    h.wake()
    await sleep(5)
  }
}

// vscode 桩（进程内钩——主进程 VSC 模块装载面；子进程另有其桩，见 runLoopChild）
const VSCODE_STUB_SRC = `
const mk = () => new Proxy(function vscodeStub() {}, { get: (t, p) => (p === Symbol.toPrimitive || p === "then" ? undefined : mk()), apply: () => undefined, construct: () => mk() });
export const window = mk(); export const workspace = mk(); export const commands = mk(); export const env = mk(); export const languages = mk();
export const Uri = mk(); export const Range = mk(); export const Position = mk(); export const Selection = mk(); export const MarkdownString = mk();
export const ThemeColor = mk(); export const StatusBarAlignment = mk(); export const ProgressLocation = mk(); export const ConfigurationTarget = mk();
export const DiagnosticSeverity = mk(); export const DocumentSymbol = mk(); export const SymbolKind = mk(); export const RelativePattern = mk();
export const WorkspaceEdit = mk(); export const WebviewView = mk(); export const CancellationToken = mk(); export const Disposable = mk();
export const EventEmitter = class EventEmitter { constructor() { this.event = () => ({ dispose() {} }) } fire() {} dispose() {} };
export default { window, workspace, commands, env, languages, Uri };
`
const VSCODE_STUB_URL = "data:text/javascript," + encodeURIComponent(VSCODE_STUB_SRC)
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "vscode") return { url: VSCODE_STUB_URL, shortCircuit: true }
    return next(specifier, context)
  },
})

// ─── 模块装载（真件；跨包同一性按「各自解析上下文」+ realpath 双证——先例 = B2 批内件注②）──


const coreSusp = await mod("thincoder-core/agent/suspension.mjs")


// ═════════════════════ G3 · 挂起状态机（P3 + 核增补 C ∕ D） ═════════════════════

/** 载体夹具（history 形——pushReal 需要 history/_fullHistory；池 ∕ pending 单容器全挂本对象）。 */
function carrier() {
  return {
    _asyncSubagents: new Map(),
    _asyncAdvisors: new Map(),
    _pendingAsyncResults: [],
    _consultSessions: new Map(),
    history: [],
    _fullHistory: [],
  }
}
/** 池条目夹具：`aborted` 真 ⇒ controller.signal.aborted（D 只清已死的判据 = parentAborted）。 */
function entry(id, role, { aborted = false, done = false } = {}) {
  const controller = new AbortController()
  if (aborted) controller.abort()
  return { id, role, status: done ? "done" : "running", done, cancelled: false, controller, _inPending: false, report: null }
}

test("G3a 状态机 step1–4 序：用户输入优先 → 消化轮（pending） → 池空自然退出 + 退出清场", async () => {
  const c = carrier()
  c._asyncSubagents.set("1", entry(1, "explore"))
  const seen = []
  const counts = []
  const h = coreSusp.startSuspension({
    carrier: c,
    runTurn: async (item, opts) => { seen.push([item, opts]); if (opts?.autoTurn) c._pendingAsyncResults.length = 0 },
    hooks: { onCounts: (n) => counts.push(n) },
  })
  await sleep(20) // 进入等待（池 live）
  h.pushInput("U1")
  await wakeUntil(h, () => seen.length >= 1)
  assert.equal(seen[0][0], "U1", "step1：用户输入优先开普通回合")
  assert.equal(seen[0][1], undefined, "用户回合无 opts")
  c._pendingAsyncResults.push({ id: 9, role: "subagent", report: "r" })
  await wakeUntil(h, () => seen.length >= 2)
  assert.equal(seen[1][0], "", "step2：pending ⇒ 消化轮（空输入）")
  assert.deepEqual(seen[1][1], { autoTurn: true, upstreamTurn: false }, "消化轮 opts 形")
  c._asyncSubagents.clear()
  const ticker = setInterval(() => h.wake(), 10)
  const res = await h.done
  clearInterval(ticker)
  assert.equal(res.reason, "idle", "step3：池空 + pending 空 ⇒ 自然退出（idle）")
  assert.deepEqual(res.residualInput, [], "idle 残输入空")
  assert.ok(counts.length >= 2, "onCounts 钩沿途触发")
})

test("G3b 核增补 C：缺省 shift + pushInput 原值（对象引用未 String 化）", async () => {
  const c = carrier()
  c._asyncSubagents.set("1", entry(1, "explore"))
  const seen = []
  const h = coreSusp.startSuspension({ carrier: c, runTurn: async (item, opts) => { seen.push([item, opts]) } })
  const obj = { rich: true, text: "x" }
  h.pushInput(obj)
  h.pushInput("second")
  h.wake()
  await sleep(20)
  assert.equal(seen[0][0], obj, "首条 = pushInput 原值（引用未变）")
  assert.equal(seen[1][0], "second", "次条 shift")
  c._asyncSubagents.clear()
  h.wake()
  const res = await h.done
  assert.equal(res.reason, "idle")
  assert.deepEqual(res.residualInput, [])
})

test("G3c 核增补 C：ctx.inputQueue 同数组批取（takeInput 缝）+ takeInput ⇒ null 零动作不挂", async () => {
  {
    const c = carrier()
    const q = [{ text: "a" }, { text: "b" }]
    const seen = []
    let sameArray = null
    const h = coreSusp.startSuspension({
      carrier: c,
      inputQueue: q,
      takeInput: async (queue) => { sameArray = queue === q; return queue.splice(0, 2).map((e) => e.text).join(" + ") },
      runTurn: async (item) => { seen.push(item) },
    })
    const res = await h.done
    assert.equal(sameArray, true, "takeInput 收到宿主同数组")
    assert.equal(seen[0], "a + b", "批取产物进 runTurn")
    assert.equal(q.length, 0, "宿主数组就地消费")
    assert.deepEqual(res.residualInput, [], "出窗（residualInput 空）")
  }
  {
    const c = carrier()
    const q = [{ text: "/cmd" }]
    const leftover = q[0]
    let runN = 0
    const h = coreSusp.startSuspension({
      carrier: c, inputQueue: q,
      takeInput: async () => null,
      runTurn: async () => { runN++ },
    })
    const res = await h.done
    assert.equal(runN, 0, "null ⇒ 零回合（防御面不挂循环）")
    assert.equal(res.residualInput[0], leftover, "条目不消费（残输入同引用兑现）")
    assert.equal(q.length, 0, "宿主数组经残输入出窗（同数组语义）")
  }
})

test("G3d timer 第四态：deadline 现算 + deliver 严格布尔（真 ⇒ timer 轮恰一次）", async () => {
  const c = carrier()
  c._asyncSubagents.set("1", entry(1, "explore"))
  const calls = []
  let delivered = true
  const h = coreSusp.startSuspension({
    carrier: c,
    runTurn: async (item, opts) => { calls.push([item, opts]) },
    timerFace: {
      deadline: () => Date.now() - 1,
      deliver: () => { const was = delivered; delivered = false; return was },
    },
    timer: (fn) => setTimeout(fn, 1),
    clear: (t) => clearTimeout(t),
  })
  await sleep(30)
  assert.deepEqual(calls[0]?.[1], { autoTurn: true, timerTurn: true }, "timer 轮开轮（autoTurn + timerTurn）")
  c._asyncSubagents.clear()
  h.wake()
  await h.done
  assert.equal(calls.length, 1, "timer 轮恰一次")
})

test("G3e 核增补 D：abort 只清已死（存活留池 · 墓碑 · 整批提醒 · pending 清不注入 · 会诊清）", async () => {
  const c = carrier()
  let sess1 = null
  const dead = entry(1, "explore", { aborted: true })
  const live = entry(2, "eng-coder")
  const deadAdv = entry(3, "advisor", { aborted: true })
  c._asyncSubagents.set("1", dead)
  c._asyncSubagents.set("2", live)
  c._asyncAdvisors.set("3", deadAdv)
  c._pendingAsyncResults.push({ id: 9, role: "subagent", report: "stale" })
  c._consultSessions.set("s1", (sess1 = { stopped: false }))
  let injected = 0
  const ctrl = new AbortController()
  ctrl.abort()
  const h = coreSusp.startSuspension({
    carrier: c, abortSignal: ctrl.signal,
    runTurn: async () => {},
    injectResidual: async () => { injected++ },
  })
  const res = await h.done
  assert.equal(res.reason, "aborted", "reason = aborted")
  assert.ok(!c._asyncSubagents.has("1") && !c._asyncAdvisors.has("3"), "死条目出池（含 advisor 池）")
  assert.equal(c._asyncSubagents.get("2"), live, "存活条目留池（负控：全清会误杀）")
  assert.equal(c._asyncTombstones?.get("1")?.status, "discarded", "墓碑（discarded）")
  assert.equal(c._pendingAsyncResults.length, 0, "pending 容器清（中止不注入陈旧结果）")
  assert.equal(injected, 0, "中止不触发注入器")
  assert.ok(c._fullHistory.some((m) => String(m.content).includes("discarded by the user")), "整批提醒入流（§6.20 一次 pushReal）")
  assert.equal(sess1.stopped === true && c._consultSessions.size === 0, true, "会诊会话清理（stopped 标记 + 池清）")
})

test("G3f 退出清场 idle 支：残余逐条直注入（保序 · 清容器）", async () => {
  const c = carrier()
  const e1 = { id: 1, role: "subagent", report: "r1" }
  const e2 = { id: 2, role: "consult", report: "r2" }
  c._pendingAsyncResults.push(e1, e2)
  const seen = []
  await coreSusp.finishSuspension(c, { aborted: false, injectResidual: async (e) => { seen.push(e) } })
  assert.deepEqual(seen.map((e) => e.id), [1, 2], "残余逐条注入（保持序）")
  assert.equal(c._pendingAsyncResults.length, 0, "容器清空")
})
