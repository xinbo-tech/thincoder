/**
 * 2026-09-29-parity-b1-vsc-core-host.test.mjs — 批次本地单元件（parity-b1 · VSC+CLI 收口核 · 随批留存归档）。
 * 拆自 `2026-09-29-parity-b1-vsc-core.test.mjs`（#788 批内件挂载面归一——拆分计划 §2.11「先拆后改」；断言逐字迁移）。
 * 覆盖 = G7 结构面 + G6 runTurnLoop host 包装（子进程真件 + 三桩——自 spawn 同件自持）。
 * 名随批次档 · 住批次目录 · 不进仓套件；复跑 = 从仓库根 `thincoder/`：
 *   node --test docs/batches/2026-09-29-parity-b1-vsc-core-host.test.mjs
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

// ─── 子进程模式：G6 runTurnLoop host 包装（核 `runAgent` ∕ VSC host 装配 ∕ vscode 三桩重定向——与主体隔离进程）──
if (process.env.B1_LOOP_CHILD === "1") await runLoopChild()

const mod = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href)

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



const readSrc = (rel) => readFileSync(resolve(ROOT, rel), "utf8")

// ═════════════════════ G7 · 结构面（跨组收口） ═════════════════════

test("G7 结构机检：批内受影响档行数读数（§2.0 口径）+ 删档缺席 + 悬空 import 零", () => {
  // 断代重锚 2026-10-04（父侧 · 台账 #798）：全表行数读数随各档后续批落盘齐平（原 09-29 读数——断代红）；
  // `rules-face.mjs` 已随后续批退场（原行数行撤——下行缺席断言接）。
  const readings = {
    "thincoder-vscode/src/agent.mjs": 10,
    "thincoder-vscode/src/agent/setup.mjs": 310,
    "thincoder-vscode/src/agent/run-helpers.mjs": 89,
    "thincoder-vscode/src/agent/setup-reminders.mjs": 66,
    "thincoder-vscode/src/agent/tool-table.mjs": 191,
    "thincoder-vscode/src/agent/setup-tooltable.mjs": 104,
    "thincoder-vscode/src/agent/turn-domains.mjs": 38,
    "thincoder-vscode/src/agent/agent-state.mjs": 159,
    "thincoder-vscode/src/extension/skills.mjs": 6,
    "thincoder-vscode/src/extension/peer-claims.mjs": 35,
    "thincoder-vscode/src/extension/peer-domains.mjs": 33,
    "thincoder-vscode/src/extension/peer-instances.mjs": 21,
    "thincoder-vscode/src/extension/suspension.mjs": 329,
    "thincoder-vscode/src/extension/panel-turn-loop.mjs": 304,
    "thincoder-vscode/src/extension/panel-turn-stages.mjs": 247,
    "thincoder-vscode/src/extension/panel-chat.mjs": 261,
    "thincoder-vscode/src/extension/image-handler.mjs": 59,
    "thincoder-cli/src/tui/suspension-drive.mjs": 255,
    "thincoder-core/agent/suspension.mjs": 327,
  }
  for (const [rel, expect] of Object.entries(readings)) {
    assert.equal(readSrc(rel).split("\n").length, expect, `${rel} 行数读数 = ${expect}`)
  }
  assert.ok(!existsSync(resolve(ROOT, "thincoder-vscode/src/agent/rules-face.mjs")), "rules-face.mjs 已不在盘（后续批退场——原行数行撤；父侧重锚 2026-10-04）")
  for (const gone of [
    "thincoder-vscode/src/agent/context-injections.mjs",
    "thincoder-vscode/src/agent/execute-tools.mjs",
    "thincoder-vscode/src/agent/response-stages.mjs",
    "thincoder-vscode/src/agent/run-stages.mjs",
    "thincoder-vscode/src/agent/tool-gates.mjs",
  ]) {
    assert.ok(!existsSync(resolve(ROOT, gone)), `退役档缺席：${gone}`)
  }
})

// ═══════════════ G6 · runTurnLoop host 包装（子进程真件 + 三桩） ═══════════════

test("G6 runTurnLoop：首段装配 ∕ 载体面（14 字段 + history 原位回收）∕ 完成面 ∕ Ctrl+I 与 ContinueError 续跑", () => {
  let out = ""
  try {
    out = execFileSync(process.execPath, [HERE], { env: { ...process.env, B1_LOOP_CHILD: "1" }, encoding: "utf8", timeout: 120000 })
  } catch (e) {
    assert.fail(`G6 子进程退出非零：\n${e.stdout ?? ""}\n${e.stderr ?? ""}`)
  }
  assert.match(out, /RESULT: PASS (\d+) · FAIL 0/, "子进程全绿")
  assert.ok(Number(out.match(/RESULT: PASS (\d+)/)[1]) >= 20, "断言计数 ≥ 20")
})

// ─────────────────────────── 子进程：runTurnLoop host 包装（真件 + 三桩） ───────────────────────────

async function runLoopChild() {
  const encStub = (src) => "data:text/javascript," + encodeURIComponent(src)
  // vscode 桩（P4-II 同形：面板调用链所需键）
  const VSCODE = encStub(`
export const languages = { getDiagnostics: () => [] };
export const DiagnosticSeverity = { Error: 0, Warning: 1, Information: 2, Hint: 3 };
export const env = { language: "zh-CN" };
export const workspace = { workspaceFolders: null };
export const window = { showErrorMessage: () => {}, showInformationMessage: () => {}, createStatusBarItem: () => ({ show() {}, hide() {}, dispose() {}, text: "", tooltip: "" }), onDidChangeActiveTextEditor: () => ({ dispose() {} }) };
export const commands = { executeCommand: async () => [], registerCommand: () => ({ dispose() {} }) };
export const Uri = { file: (p) => ({ fsPath: p, toString: () => "file://" + p }) };
export const Position = class Position { constructor(l, c) { this.line = l; this.character = c } };
export const SymbolKind = { Function: 1 };
export const StatusBarAlignment = { Left: 1, Right: 2 };
export const ViewColumn = { One: 1 };
export const ThemeColor = class ThemeColor { constructor(id) { this.id = id } };
export const EventEmitter = class EventEmitter { constructor() { this.event = () => ({ dispose() {} }) } fire() {} dispose() {} };
export const Disposable = { from: () => ({ dispose() {} }) };
export default { languages, DiagnosticSeverity, env, workspace, window, commands, Uri };
`)
  // 核 runAgent 桩（脚本化按次行为；calls 供断言）
  const HELPERS_URL = pathToFileURL(resolve(ROOT, "thincoder-vscode/node_modules/@thincoder/core/agent/helpers.mjs")).href // #788：vsc junction 同源（挂载面归一）
  const CORE_AGENT = encStub(`
export const calls = [];
let script = [];
export function __setScript(s = []) { script = [...s]; calls.length = 0 }
export function __calls() { return calls }
export async function runAgent(agent, input, callbacks = {}, opts = {}) {
  calls.push({ agent, input, opts: { ...opts } });
  const step = script.shift() ?? { kind: "clean", content: "ok" };
  if (step.kind === "clean") {
    if (step.mutate) step.mutate(agent, callbacks);
    if (step.distill) agent._pendingDistill = Promise.resolve("distilled");
    if (step.inheritedGuard) agent._inheritedGuard = step.inheritedGuard;
    return step.content ?? "ok";
  }
  if (step.kind === "interrupt") { const e = new Error("User interrupted"); e.name = "AbortError"; throw e; }
  if (step.kind === "continue") { const { ContinueError } = await import(${JSON.stringify(HELPERS_URL)}); throw new ContinueError(step.turn ?? 3); }
  throw new Error(step.message ?? "provider boom");
}
`)
  // VSC host 装配桩（hydrateRun ∕ setupAgentRun —— 对齐 §2.3 件 1 逐段对位：载体 + adapter 三键写回）
  const SETUP = encStub(`
export const hydrateCalls = [];
export const setupCalls = [];
let failNext = false;
export function __setFail(v) { failNext = v }
export function __calls() { return { hydrateCalls, setupCalls } }
export function __reset() { hydrateCalls.length = 0; setupCalls.length = 0; failNext = false }
function assemble(agent, ctx) {
  const { input, opts } = ctx;
  agent.history = opts.history;
  agent.cwd = ctx.cwd;
  agent._role = ctx.role ?? null;
  agent.config = { agent: { engineering: false }, traces: { enabled: false } };
  agent._tasks = agent._tasks ?? [];
  agent._goal = agent._goal ?? null;
  agent._planMode = false;
  opts.promptTail = "TAIL-BLOCK";
  opts.turnDomainText = "DOMAIN-TEXT";
  opts.toolDecorate = { marker: "decorate" };
  return { agent, history: opts.history, fullHistory: opts.fullHistory, input };
}
export async function hydrateRun(agent, ctx) {
  hydrateCalls.push({ agent, ctx: { ...ctx, opts: { ...ctx.opts } } });
  if (failNext) throw new Error("hydrate failed (fixture)");
  return assemble(agent, ctx);
}
export async function setupAgentRun(ctx) {
  setupCalls.push({ ctx: { ...ctx, opts: { ...ctx.opts } } });
  if (failNext) throw new Error("hydrate failed (fixture)");
  return assemble({ _tasks: [], _goal: null, _pendingTimers: [] }, ctx);
}
`)
  registerHooks({
    resolve(specifier, context, next) {
      if (specifier === "vscode") return { url: VSCODE, shortCircuit: true }
      if (specifier === "@thincoder/core/agent.mjs") return { url: CORE_AGENT, shortCircuit: true }
      const r = next(specifier, context)
      if (typeof r?.url === "string" && r.url.endsWith("thincoder-vscode/src/agent/setup.mjs")) return { url: SETUP, shortCircuit: true }
      return r
    },
  })

  const { runTurnLoop } = await import(pathToFileURL(resolve(ROOT, "thincoder-vscode/src/extension/panel-turn-loop.mjs")).href)
  const { buildPanelCallbacks } = await import(pathToFileURL(resolve(ROOT, "thincoder-vscode/src/extension/panel-callbacks.mjs")).href)
  const coreStub = await import(CORE_AGENT)
  const { __setScript, __calls } = coreStub
  const setupStub = await import(SETUP)
  const { __calls: __setupCalls, __reset: __setupReset, __setFail } = setupStub

  let pass = 0, fail = 0
  const ok = (name, cond, extra = "") => { if (cond) { pass++; console.log(`  PASS  ${name}`) } else { fail++; console.log(`  FAIL  ${name}${extra ? ` — ${extra}` : ""}`) } }
  const eq = (name, a, b) => ok(name, Object.is(a, b), `got=${JSON.stringify(a)} want=${JSON.stringify(b)}`)

  const makePanel = ({ agent = null } = {}) => {
    const posted = [], saved = []
    const panel = {
      _agent: agent, _autoApprove: false, _abortRequested: false, _turnControllers: [],
      _guardCarry: null, _distillState: { pending: null }, _distillController: new AbortController(),
      _questionQueue: [], _questionSeq: 0, _slot: 7, _engShown: false,
      _panel: { webview: { postMessage: (m) => posted.push(m) } },
      _saveLines: (...args) => saved.push(args),
      _pushSessions: () => { panel._pushed = (panel._pushed ?? 0) + 1 },
      _refreshStatus: () => {}, _setStatus: () => {}, _setPlanMode: async () => {},
      _pushSettingsLight: () => { panel._settingsLight = (panel._settingsLight ?? 0) + 1 },
      _publishTurnState: () => {}, _notifier: { turnDone: () => { panel._turnDone = (panel._turnDone ?? 0) + 1 } },
    }
    panel._abortController = new AbortController()
    return { panel, posted, saved }
  }
  const deps = (panel, over = {}) => {
    const history = over.history ?? []
    const fullHistory = over.fullHistory ?? []
    const p = { baseURL: "https://api.example.test/v1", model: "m-1" }
    const d = {
      text: "hello", cwd: ROOT, p, images: null, history, fullHistory,
      autoTurn: false, upstreamTurn: false, susp: null, timerTurn: false,
      turnSlot: 7, tLog: {}, askInPanel: async () => "Stop", slotStamp: { activeProvider: "x", activeModel: "m-1" },
      ...over,
    }
    d.callbacks = buildPanelCallbacks(panel, {
      cwd: d.cwd, p, fullHistory, history, providerName: "x", turnSlot: 7, distillSlot: 7,
      autoTurn: d.autoTurn, askInPanel: d.askInPanel, slotStamp: d.slotStamp,
    })
    return d
  }

  // ── C1：首段装配 ∕ 载体面（14 字段 + history 原位回收）∕ 完成面 ──
  {
    __setupReset()
    __setScript([{
      kind: "clean", content: "ASSISTANT-TEXT", distill: true,
      mutate: (agent, cb) => {
        agent.tasks = [{ status: "done", title: "t1" }]
        agent.planMode = true
        cb.onTurnEnd?.(agent, 0)
        agent.history = [{ role: "user", content: "v2" }] // 压缩 ∕ 蒸馏替换点形（`agent.history = <新数组>`）
      },
    }])
    const { panel, posted, saved } = makePanel({ agent: { _tasks: [], _goal: null } })
    panel._guardCarry = { mutated: true }
    const d = deps(panel)
    await runTurnLoop(panel, d)
    const calls = __calls()
    const { hydrateCalls, setupCalls } = __setupCalls()
    const core = calls[0]
    eq("hydrateRun 恰好 1 次（复用路径 ∕ 装配不重入）", hydrateCalls.length, 1)
    eq("setupAgentRun 未调用", setupCalls.length, 0)
    eq("核 runAgent 恰好 1 次", calls.length, 1)
    eq("coreOpts.resume（首段）", core.opts.resume, false)
    eq("coreOpts.suspDriven", core.opts.suspDriven, true)
    ok("coreOpts.signal = 回合 controller signal", core.opts.signal === panel._abortController.signal)
    eq("A2 promptTail（装配写回）", core.opts.promptTail, "TAIL-BLOCK")
    eq("A3 turnDomainText（装配写回）", core.opts.turnDomainText, "DOMAIN-TEXT")
    ok("裁定① toolDecorate（装配写回）", core.opts.toolDecorate?.marker === "decorate")
    eq("B distillSignal = 面板 controller signal", core.opts.distillSignal, panel._distillController.signal)
    ok("consumeQueuedInput = 函数（用户回合）", typeof core.opts.consumeQueuedInput === "function")
    // 载体面：14 字段别名 + 容器建齐 + history 访问器原位回收（压缩后共享数组回收）
    const a = core.agent
    ok("agent.history === history（访问器锚）", a.history === d.history)
    ok("载体字段别名（_asyncSubagents ⇄ history）", a._asyncSubagents === d.history._asyncSubagents && a._asyncSubagents instanceof Map)
    ok("六容器建齐", Array.isArray(d.history._pendingAsyncResults) && Array.isArray(d.history._asyncWaiters) && Array.isArray(d.history._mutLog) && d.history._advisorRuns instanceof Map)
    a._asyncSubagents.set("x", 1)
    eq("载体写两向同步（history 读）", d.history._asyncSubagents.get("x"), 1)
    const before = d.history
    a.history = [{ role: "user", content: "v2" }]
    ok("history setter 原位回收（同一数组——跨替换稳定）", a.history === before && before.length === 1 && before[0].content === "v2")
    ok("agent._inheritedGuard = 面板 carry 快照（一次性取走）", a._inheritedGuard?.mutated === true && panel._guardCarry === null)
    // 完成面（真 onComplete）
    ok("onComplete 触发（webview complete 帧）", posted.some((m) => m.type === "complete"))
    ok("onComplete 槽回写（saveLines 携 agentState）", saved.length >= 1 && saved[0][2].tasks?.[0]?.title === "t1")
    eq("onComplete pushSessions", panel._pushed, 1)
    eq("onComplete 非 digest ⇒ turnDone 通知", panel._turnDone, 1)
    // 推送腿（onTurnEnd）
    ok("task 腿回填（_tasks）", a._tasks === a.tasks)
    ok("plan 腿回填 + 帧上屏", a._planMode === true && posted.some((m) => m.type === "planMode" && m.active === true))
    ok("蒸馏载具回填（panel._distillState.pending）", panel._distillState.pending === a._pendingDistill)
    ok("panel._agent write-back", panel._agent === a)
  }

  // ── C2：Ctrl+I 中断续跑（核抛出物无 .reason ⇒ 回落 controller signal.reason） ──
  {
    __setupReset()
    const { panel } = makePanel({ agent: { _tasks: [], _goal: null } })
    const d = deps(panel)
    __setScript([{ kind: "interrupt" }, { kind: "clean", content: "AFTER-INTERRUPT" }])
    panel._abortController.abort({ interrupt: true, message: "please stop that" })
    await runTurnLoop(panel, d)
    const calls = __calls()
    eq("中断后重入（2 次核调用）", calls.length, 2)
    eq("续段 resume=true", calls[1].opts.resume, true)
    ok("controller 已重建（新 signal）", calls[1].opts.signal !== calls[0].opts.signal)
    eq("装配不重入（hydrateRun 仍 1 次）", __setupCalls().hydrateCalls.length, 1)
    eq("续跑成功（tLog 不落 stopped）", d.tLog.result, undefined)
  }

  // ── C3：ContinueError 用户档 —— Continue ⇒ 续跑；Stop ⇒ 收束 ──
  {
    __setupReset()
    let asked = 0
    const { panel, posted } = makePanel({ agent: { _tasks: [], _goal: null } })
    const d = deps(panel, { askInPanel: async () => { asked++; return "Continue" } })
    __setScript([{ kind: "continue", turn: 9 }, { kind: "clean", content: "SEG-2" }])
    await runTurnLoop(panel, d)
    eq("询问 1 次", asked, 1)
    eq("Continue ⇒ 续跑（2 次调用）", __calls().length, 2)
    ok("未发 aborted 帧", !posted.some((m) => m.type === "aborted"))
  }
  {
    __setupReset()
    const { panel, posted } = makePanel({ agent: { _tasks: [], _goal: null } })
    const d = deps(panel, { askInPanel: async () => "Stop" })
    __setScript([{ kind: "continue", turn: 9 }])
    await runTurnLoop(panel, d)
    eq("Stop ⇒ 单次调用", __calls().length, 1)
    ok("aborted 帧", posted.some((m) => m.type === "aborted"))
    eq("tLog.result = stopped", d.tLog.result, "stopped")
  }

  // ── C4：Stop（无 reason）⇒ 不续跑 ──
  {
    __setupReset()
    const { panel, posted } = makePanel({ agent: { _tasks: [], _goal: null } })
    const d = deps(panel)
    __setScript([{ kind: "interrupt" }])
    panel._abortController.abort()
    await runTurnLoop(panel, d)
    eq("Stop（无 reason）⇒ 不续跑（1 次调用）", __calls().length, 1)
    ok("aborted 帧", posted.some((m) => m.type === "aborted"))
  }

  console.log(`\nRESULT: PASS ${pass} · FAIL ${fail}`)
  process.exit(fail ? 1 : 0)
}
