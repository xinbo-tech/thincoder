/**
 * 2026-10-05-digest-accounting-cli.test.mjs — 批内件（消化账务批 · 台账 #930 · 端面舱 #42 · CLI 腿）。
 * 任务书 = `docs/batches/2026-10-05-digest-accounting.md` §2 ∥ 判据单源 = 设计档
 * `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.31（尤其 §6.31.6 三端可见面）。
 * 用例 = T-DA11（CLI 面）：消化轮收尾 `unsettled = N`（> 0）⇒ `digestEndRecord` 携 `unsettled` +
 * 终态行之后再落残余痕行（`digest.residue`——核字典单源）；`= 0` ⇒ 零行（零噪音）；非上行轮门同判；
 * 重建（`historyToLines`）同调。断言只取行为 / 结构机检面（零散文锚）。
 * 平 node 直驱：真 `digestTurn`（`ctx.runAgent` 桩——沿 `2026-10-01-digest-rows-natural-form-cli-vsc` 先例）。
 * 跑法（仓根 `thincoder/`）：node --test docs/batches/2026-10-05-digest-accounting-cli.test.mjs
 * 本件不入仓套件（批内件 · 随批留存）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!readFileSync(resolve(ROOT, "thincoder-core/context.mjs"), "utf8")) throw new Error(`从仓库根（thincoder/）运行（cwd = ${ROOT}）`)
const mod = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href)

const [i18n, startup, drive, conversation, ansiMod, lifecycle] = await Promise.all([
  mod("thincoder-core/i18n.mjs"), // 痕行文案单源（残余行 = 核字典 `digest.residue`）
  mod("thincoder-cli/src/tui/startup.mjs"), // 读面（historyToLines 复列）
  mod("thincoder-cli/src/tui/suspension-drive.mjs"), // 写点（digestTurn——真驱动）
  mod("thincoder-cli/src/tui/conversation-writer.mjs"), // 真写入面（pushLine）
  mod("thincoder-cli/src/tui/ansi.mjs"),
  mod("thincoder-cli/src/tui/lifecycle-records.mjs"), // 记录 ∥ 痕行单实现
])
const { t } = i18n
const { C } = ansiMod

/** 伪存储（`_recordStore` 最小形——写缝承载；沿 #726 批内件先例）。 */
function fakeStore(entries = []) {
  const appended = []
  return {
    appended,
    entries,
    append(r) { appended.push(r); return true },
    firstUserMessage: () => null,
    total: () => entries.length,
    *iterate(direction = "newest") {
      for (const m of (direction === "oldest" ? entries : [...entries].reverse())) yield m
    },
    page(start, end, { margin = 1 } = {}) {
      const lo = Math.max(0, start - margin)
      const hi = Math.min(entries.length, end + margin)
      return { messages: entries.slice(lo, hi), base: lo }
    },
  }
}

/** TUI state 最小形（写入面所需字段——真装配面字段子集）。 */
function tuiState() {
  return {
    lines: [], _linesChars: 0, _lineIdCounter: 0, _historyLoaded: 0, _historyTotal: 0, _hasOlder: false, scroll: 0,
    processing: false, status: "Ready", exitArmed: false, streaming: "", reasoning: "",
    _advisorBlocks: [], currentTool: null, processingStarted: 0, lastOutputAt: 0,
    _turnControllers: [], controller: null, interruptPrompt: null, attentionAwaiting: false,
    subTasks: {}, tasks: [], queue: [], pendingInput: [],
    suspended: false, _suspPending: false, _suspAborted: false,
    foldEnabled: true, expandedBlocks: new Set(), _foldScroll: new Map(),
    dims: { get: () => ({ cols: 80, rows: 24 }) },
    _agent: null,
  }
}

/** agent 最小形（写缝载体：`_fullHistory` 人读线 ∥ `_recordStore` 伪存储；pending 单容器 = 账目读面）。 */
function fakeAgent(over = {}) {
  const store = over._recordStore === undefined ? fakeStore() : over._recordStore
  return {
    cwd: "C:/fake", title: "t", autoApprove: true,
    history: [], _fullHistory: [], _historyWindow: 0,
    _recordStore: store,
    _pendingAsyncResults: [], _asyncSubagents: new Map(), _asyncAdvisors: new Map(),
    _pendingDistill: null, _sessionAbort: null, _sessionAbortAll: null,
    ...over,
  }
}

/** 回合 ctx 最小形（`digestTurn` 直驱——真 conversation-writer 写入面）。 */
function turnFixture({ agent = fakeAgent(), state = tuiState(), runAgent = async () => {} } = {}) {
  const render = () => {}
  const writer = conversation.createConversationWriter({ state, render })
  const ctx = {
    agent, state, render, scheduleRender: render,
    pushLine: writer.pushLine, pushLabel: writer.pushLabel, ensureAssistantLabel: writer.ensureAssistantLabel,
    handleSlash: async () => {}, saveSession: () => {}, runAgent, distillFlushTimeoutMs: 1,
    askPermission: null, askBatchPermission: null, askQuestion: null,
  }
  return { ctx, agent, state }
}

const msToSeconds = (ms) => (ms / 1000).toFixed(1)
const endRecOf = (agent) => [...agent._recordStore.appended].reverse().find((r) => r.kind === "digest" && r.status === "end")
const residueText = (n) => t("digest.residue", { n })

test("CLI-1 · 残余行（> 0）：消化轮收尾 `unsettled = 1` ⇒ 终态行之后再落一行 dim（记录同携 `unsettled`；文案 = 核字典单源）", async () => {
  const { ctx, agent, state } = turnFixture()
  agent._pendingAsyncResults = [{ role: "explore", id: 1, _daFailures: 1, _daDelivered: true }] // 未销账（判据 = `_daFailures > 0`）
  await drive.digestTurn(ctx, false)
  const endRec = endRecOf(agent)

  assert.equal(endRec.unsettled, 1, "记录携 `unsettled`（本轮未销账条数）")
  assert.equal(endRec.ok, true)
  const texts = state.lines.map((l) => l.text)
  assert.deepEqual(texts, [
    t("digest.turnLabel"), t("digest.start", { n: 1 }), t("digest.done", { n: 1, seconds: msToSeconds(endRec.ms) }),
    residueText(1),
  ], "行序 = 起跑标签 → 计数 → 终态 → 残余（终态行之后再落一行）")
  const residue = state.lines[state.lines.length - 1]
  assert.equal(residue.color, C.dim, "残余行 = dim（终端同档）")
  assert.equal(state.lines.indexOf(residue), state.lines.length - 1, "追加位 = 当刻流末")
  assert.notEqual(residue, state.lines[2], "残余行 = 新行（零就地换文）")
  // 文案单源：核字典两语逐字（端侧零自持字面）
  assert.equal(t("digest.residue", { n: 1 }, "zh"), "有 1 份后台报告未销账——将自动重投", "核键 zh")
  assert.equal(t("digest.residue", { n: 1 }, "en"), "1 background report(s) not accounted — they will be re-delivered", "核键 en")
})

test("CLI-2 · 零未销账（= 0）：同形条目无失败 ⇒ 终态行独存 ∥ 记录零增键（零噪音）", async () => {
  const { ctx, agent, state } = turnFixture()
  agent._pendingAsyncResults = [{ role: "explore", id: 1 }] // 无 `_daFailures` ⇒ unsettled = 0
  await drive.digestTurn(ctx, false)
  const endRec = endRecOf(agent)

  assert.equal(state.lines.length, 3, "三行（标签 ∥ 计数 ∥ 终态）——残余行零产")
  assert.deepEqual(Object.keys(endRec).sort(), ["kind", "ms", "ok", "status", "ts"], "记录形零增键（零未销账 ⇒ 键缺席——与帧面「> 0 才携」同判）")
  assert.ok(!state.lines.some((l) => l.text.includes("not accounted") || l.text.includes("未销账")), "零残余文面")
})

test("CLI-3 · 非上行轮门：上行唤醒轮同态 ⇒ 零残余行 ∥ 记录不带 `unsettled`（三端同判据）", async () => {
  const { ctx, agent, state } = turnFixture()
  agent._pendingAsyncResults = [{ role: "explore", id: 1, _daFailures: 1, _daDelivered: true }]
  await drive.digestTurn(ctx, true) // upstream = true（上行唤醒轮——非消化轮）
  const endRec = endRecOf(agent)

  assert.equal(state.lines.length, 3, "三行——上行轮零残余行（虽 unsettled 判据 = 1）")
  assert.ok(!("unsettled" in endRec), "记录不带 `unsettled`（非上行轮门）")
  assert.ok(!state.lines.some((l) => l.text === residueText(1)), "残余行零产")
})

test("CLI-4 · 重建同调（`historyToLines`）：兜 `unsettled` 记录 ⇒ 残余行随出（记录序位）∥ 无键记录零行", () => {
  const H = [
    { role: "user", content: "问", ts: 1 },
    { kind: "digest", status: "start", n: 2, tier: "digest", ts: 2 },
    { kind: "digest", status: "end", ok: true, ms: 1200, unsettled: 2, ts: 3 },
  ]
  const texts = startup.historyToLines(H, 0, H.length).map((l) => l.text)
  assert.deepEqual(texts.slice(-2), [
    t("digest.done", { n: 2, seconds: "1.2" }), residueText(2),
  ], "重建：终态行之后残余行随出（记录携 `unsettled` ⇒ 复列同调）")
  const H0 = [
    { role: "user", content: "问", ts: 1 },
    { kind: "digest", status: "start", n: 2, tier: "digest", ts: 2 },
    { kind: "digest", status: "end", ok: true, ms: 1200, ts: 3 },
  ]
  const texts0 = startup.historyToLines(H0, 0, H0.length).map((l) => l.text)
  assert.deepEqual(texts0.slice(-1), [t("digest.done", { n: 2, seconds: "1.2" })], "无键记录 ⇒ 零残余行（跨批旧记录零回归）")
})

test("CLI-5 · 单源接线（结构机检）：判据经核件 `unsettledCount` ∥ 行文经核字典 `digest.residue`（端侧零自持）", () => {
  const sd = readFileSync(resolve(ROOT, "thincoder-cli/src/tui/suspension-drive.mjs"), "utf8")
  assert.ok(sd.includes('from "@thincoder/core/agent/digest-account.mjs"'), "判据 = 核件单源（`unsettledCount` 导入）")
  assert.ok(sd.includes("unsettledCount(agent)"), "digestTurn 读位 = 核件（非端侧自持计数）")
  assert.ok(/digestEndRecord\(\{[^}]*unsettled[^}]*\}\)/.test(sd), "收尾记录携 `unsettled` 单点")
  const lr = readFileSync(resolve(ROOT, "thincoder-cli/src/tui/lifecycle-records.mjs"), "utf8")
  assert.ok(lr.includes('t("digest.residue", { n: unsettled })'), "残余行文 = 核字典键直取")
  assert.ok(!lr.includes("未销账——"), "端侧零自持字面（文案不在本档）")
})
