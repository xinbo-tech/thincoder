/**
 * 2026-10-05-digest-accounting-vsc.test.mjs — 批内件（消化账务批 · 台账 #930 · 端面舱 #42 · VSC 腿）。
 * 任务书 = `docs/batches/2026-10-05-digest-accounting.md` §2 ∥ 判据单源 = 设计档
 * `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.31（尤其 §6.31.6 三端可见面）。
 * 用例 = T-DA11（VSC 面）：`digest end` 消息 / 记录携 `unsettled`（非上行轮且 > 0 才携）⇒ 残余元素
 * （`.digest-status` 族——词键 `digest.residue` 核字典直取）；`= 0` ⇒ 零元素；复列（记录携 ⇒ 重建随出）；
 * 端壳载体表 +2（`_unsettledDigests` ∥ `_daSession`——跨 run 存活绑定）。断言只取行为 / 结构机检面。
 * 跑法（仓根 `thincoder/`）：node --test docs/batches/2026-10-05-digest-accounting-vsc.test.mjs
 * 本件不入仓套件（批内件 · 随批留存）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { resolve, join } from "node:path"
import { pathToFileURL } from "node:url"
import { registerHooks } from "node:module"

const ROOT = process.cwd()
if (!readFileSync(resolve(ROOT, "thincoder-core/context.mjs"), "utf8")) throw new Error(`从仓库根（thincoder/）运行（cwd = ${ROOT}）`)
const mod = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href)

// ─── 假 DOM bootstrap（happy-dom——沿 `2026-10-01-digest-replay-choices` 先例）──
const { GlobalRegistrator } = await import(pathToFileURL(resolve(ROOT, "thincoder-vscode/node_modules/@happy-dom/global-registrator/lib/index.js")).href)
GlobalRegistrator.register()
document.body.innerHTML = `
  <div id="chat-container">
    <div id="messages"></div>
    <div id="subagent-activity"></div>
    <div id="toolbar"><div id="status-line"></div><div id="input-row"><textarea id="input"></textarea></div></div>
    <div id="model-dropdown"></div><div id="reasoning-dropdown"></div><div id="session-dropdown"></div>
    <button id="session-selector"></button><span id="session-title"></span>
  </div>`
globalThis.acquireVsCodeApi = () => ({ postMessage() {}, getState: () => ({}), setState() {} })

// ─── vscode 宿主桩（extension 档装载——须先于 suspension.mjs 取件注册）──
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
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "vscode") return { url: "data:text/javascript," + encodeURIComponent(VSCODE_STUB_SRC), shortCircuit: true }
    return next(specifier, context)
  },
})

// ─── 模块装载（VSC webview 三件 ∥ extension 两件 ∥ 核字典）──
const [wstate, wi18n, wchat, wrestore, whistory, i18nCore] = await Promise.all([
  mod("thincoder-vscode/webview/state.js"), // ctx（messagesEl）
  mod("thincoder-vscode/webview/i18n.js"), // 词面注入（host 契约同形——本件注核投影）
  mod("thincoder-vscode/webview/chat-status.js"), // 真 showDigestStatus ∥ 构形件
  mod("thincoder-vscode/webview/record-restore.js"), // 重建件（扫轮 ∥ 元素面）
  mod("thincoder-vscode/webview/history.js"), // 页级 pass（重建径接线）
  mod("thincoder-core/i18n.mjs"), // 核字典（键文同源断言源）
])
wi18n.setStrings(i18nCore.projectDictionary("zh")) // 注核投影（= 生产 host 注入契约同形）
const { ctx: wctx } = wstate
const LOG = await mod("thincoder-core/log.mjs") // 日志隔离（extension 事件面）
LOG._setLogsDirForTest(mkdtempSync(join(tmpdir(), "da-vsc-leg-")))

const elKind = (el) => (el.classList.contains("digest-turn") ? "label"
  : el.classList.contains("digest-cap") ? "cap"
    : el.classList.contains("digest-done") || el.classList.contains("digest-failed") ? "end"
      : el.classList.contains("digest-status") ? "residue-or-count" : "?")
const digestEls = (root) => [...root.querySelectorAll(".digest-turn, .digest-cap, .digest-done, .digest-failed, .digest-status")]

test("VSC-1 · 残余元素（> 0）：`end` 消息携 `unsettled = 2` ⇒ 终态元素之后再落一枚（`.digest-status`；文 = 核字典同源）", () => {
  const root = wctx.messagesEl
  root.replaceChildren()
  wchat.showDigestStatus({ status: "start", n: 2, tier: "digest" })
  wchat.showDigestStatus({ status: "end", ok: true, ms: 900, unsettled: 2 })
  const kinds = digestEls(root).map(elKind)
  assert.deepEqual(kinds, ["label", "residue-or-count", "end", "residue-or-count"], "元素序 = 标签 ∥ 计数 ∥ 终态 ∥ 残余")
  const residue = digestEls(root).at(-1)
  assert.equal(residue.className, "digest-status", "残余元素 = `.digest-status` 族（追加形）")
  assert.equal(residue.textContent, i18nCore.t("digest.residue", { n: 2 }, "zh"), "文 = 核字典 `digest.residue` 直取（键文同源）")
  assert.equal(residue.textContent, "有 2 份后台报告未销账——将自动重投", "zh 逐字")
  // 零未销账 ⇒ 零元素（零噪音）
  root.replaceChildren()
  wchat.showDigestStatus({ status: "start", n: 2, tier: "digest" })
  wchat.showDigestStatus({ status: "end", ok: true, ms: 900 })
  assert.equal(digestEls(root).filter((el) => elKind(el) === "residue-or-count").length, 1, "零未销账 ⇒ 仅计数元素（残余零产物）")
  // `n = 0` 守句保持（零计数 ∥ 零终态 ∥ 零残余——残余随终态同门）
  root.replaceChildren()
  wchat.showDigestStatus({ status: "start", n: 0, tier: "ask", from: "eng-designer#8", msg: "请复核" })
  wchat.showDigestStatus({ status: "end", ok: true, ms: 900, unsettled: 2 })
  assert.deepEqual(digestEls(root).map(elKind), ["label"], "`n = 0` ⇒ 起跑元素独存（残余行随终态行同门）")
})

test("VSC-2 · 复列承接（记录携 `unsettled`）：重建件随出残余元素（`data-idx` 同位）∥ 无键 ⇒ 零元素", () => {
  const wstateCtx = { ...wctx, messagesEl: document.getElementById("messages") }
  wstateCtx.messagesEl.replaceChildren()
  const messages = [
    { kind: "digest", status: "start", n: 2, tier: "digest", idx: 10 },
    { kind: "digest", status: "end", ok: true, ms: 900, unsettled: 2, idx: 12 },
  ]
  const plan = wrestore.scanPageRounds(messages, true)
  const els = messages.flatMap((msg, index) => wrestore.restoreRecordEls(wstateCtx, msg, plan.get(index)))
  assert.deepEqual(els.map(elKind), ["label", "residue-or-count", "end", "residue-or-count"], "重建：残余元素随出（与 live 同构形件）")
  const residue = els.at(-1)
  assert.equal(residue.textContent, i18nCore.t("digest.residue", { n: 2 }, "zh"), "重建文同源")
  assert.equal(residue.dataset.idx, "12", "位次锚同源（终态同位）")
  // 页级 pass 接线（首屏径：残留元素入页）
  wstateCtx.messagesEl.replaceChildren()
  whistory.applyHistoryPage(wstateCtx, { messages, hasOlder: true, older: false })
  assert.equal(wstateCtx.messagesEl.querySelectorAll(".digest-status").length, 3, "计数 ∥ 终态 ∥ 残余三枚 `.digest-status` 入页")
  assert.ok([...wstateCtx.messagesEl.querySelectorAll(".digest-status")].some((el) => el.textContent === i18nCore.t("digest.residue", { n: 2 }, "zh")), "残余元素入页")
  // 无键记录 ⇒ 零残余元素（跨批旧记录零回归）——**先清根**：否则同位 `[data-idx]` 已入树 ⇒ 重建件幂等
  // 去重使下面断言恒真（空集也过——正控失效）
  wstateCtx.messagesEl.replaceChildren()
  const els0 = messages.map((msg, index) => ({ ...msg, ...(msg.status === "end" ? { unsettled: undefined } : {}) })).flatMap((msg, index) => wrestore.restoreRecordEls(wstateCtx, msg, plan.get(index)))
  assert.equal(els0.length, 3, "清根后重建元素在盘（免幂等去重空集——正控）")
  assert.equal(els0.some((el) => el.textContent === i18nCore.t("digest.residue", { n: 2 }, "zh")), false, "无键 ⇒ 零残余元素")
})

// ─── VSC-3 · sender 半（真 `suspensionSession` 直驱——帧 ∥ 记录携载荷）──
/** 会话夹具：pending = 一条 `_daFailures > 0` 条目（未销账判据）；rounds 脚本控制各轮清场。 */
async function driveSession({ upstream = false } = {}) {
  const suspMod = await mod("thincoder-vscode/src/extension/suspension.mjs")
  const posts = []
  const panel = {
    _panel: { webview: { postMessage: (m) => posts.push(m) } },
    _turnControllers: [], _abortController: new AbortController(),
    _saveLines: () => {}, _refreshStatus: () => {}, _agent: undefined, _timerWatch: { sync: () => {} },
  }
  const history = {
    _asyncSubagents: new Map(), _asyncAdvisors: new Map(), _consultSessions: new Map(),
    _pendingAsyncResults: [], _suspended: false,
  }
  history._pendingAsyncResults.push({ id: 7, role: "subagent", done: true, status: "done", report: "r7", _daFailures: 1, _daDelivered: true })
  if (upstream) history._childUpstream = [{ kind: "ask", from: "eng-designer#8", message: "请复核" }]
  const lines = { history, fullHistory: [] }
  let rounds = 0
  const entry = {
    turnSlot: 1, distillSlot: null, lines, pendingInput: [], timer: setTimeout, clear: clearTimeout,
    // 第一轮留态（未销账驻容——残余行载荷在态）；第二轮起清场（会话自然退出）
    runTurn: async () => { rounds += 1; if (rounds >= 2) { history._pendingAsyncResults.length = 0; history._childUpstream = [] } },
  }
  await suspMod.suspensionSession(panel, entry)
  const endMsgs = posts.filter((m) => m.type === "digest" && m.status === "end")
  const endRecs = lines.fullHistory.filter((r) => r.kind === "digest" && r.status === "end").map(({ ts, ...r }) => r)
  return { rounds, endMsgs, endRecs }
}

test("VSC-3 · sender：消化轮 end 消息 ∥ 记录携 `unsettled = 1`（未销账驻容）⇒ 清零轮零携；上行轮门（同态对照）", async () => {
  const a = await driveSession({ upstream: false })
  assert.equal(a.rounds, 2, "消化两轮（第一轮留态 ⇒ 残余载荷；第二轮清场 ⇒ 退出）")
  assert.equal(a.endMsgs[0].unsettled, 1, "end #1 携 `unsettled`（本轮未销账条数）")
  assert.equal(a.endMsgs[0].ok, true)
  assert.ok(!("unsettled" in a.endMsgs[1]), "end #2 零携（清零 ⇒ 零噪音）")
  assert.deepEqual(a.endRecs.map((r) => r.unsettled), [1, undefined], "记录（`fullHistory`）同源同点：携 ∥ 零携")

  const b = await driveSession({ upstream: true })
  assert.equal(b.endMsgs.length, a.endMsgs.length, "同态两轮（对照面）")
  assert.ok(b.endMsgs.every((m) => !("unsettled" in m)), "上行轮门：非上行轮不携（虽第一轮判据 = 1——同态对照）")
  assert.ok(b.endRecs.every((r) => !("unsettled" in r)), "记录同门")
})

test("VSC-4 · 端壳载体表 +2（结构机检）：`_unsettledDigests` ∥ `_daSession` 入 `CARRIER_FIELDS`（16 款——跨 run 存活绑定）", () => {
  const src = readFileSync(resolve(ROOT, "thincoder-vscode/src/extension/panel-turn-loop.mjs"), "utf8")
  const block = /const CARRIER_FIELDS = \[([\s\S]*?)\]/.exec(src)
  assert.ok(block, "CARRIER_FIELDS 单块可判")
  const names = [...block[1].matchAll(/"([^"]+)"/g)].map((m) => m[1])
  assert.equal(names.length, 16, "16 款（14 ⇒ 16）")
  assert.ok(names.includes("_unsettledDigests"), "升级账本入表（写面经别名落 history——跨 run 存活）")
  assert.ok(names.includes("_daSession"), "会话标记入表（读面同别名）")
  assert.ok(src.includes("16 款"), "表注同拍（计数与列表同改）")
  const aliasSrc = src.slice(src.indexOf("function bindCarrierFace"), src.indexOf("function bindCarrierFace") + 1200)
  assert.ok(aliasSrc.includes("for (const f of CARRIER_FIELDS)"), "访问器别名循环消费本表（绑定不变式单点）")
})
