/**
 * 2026-09-28-tech-debt-closeout-r6.test.mjs — 批次本地单测件
 * 批档 = `docs/batches/2026-09-28-tech-debt-closeout.md` · 轮 6（桌面 ∕ VSC ∕ 文本 · 9 条）——
 * 本件覆盖四条行为面：
 *   #425 长驻两面（chat / activity）属性名集零增通则臂（纯构树直驱——零 DOM）；
 *   #512 `syncLedger` 同引用二帧零写（补写者落地后断言节点身份不变）；
 *   #513 CLI 窗内 timer 支 `AbortError` 容纳（会话未停 ⇒ 重入；已停 ⇒ 照旧上抛）；
 *   #382 `/advisor` guard 槽单写（toggle 不触 config 写；persist 写面不携 guard）。
 * 运行（仓根）：node --test docs/batches/2026-09-28-tech-debt-closeout-r6.test.mjs
 * 说明：`/rc/` 解析钩子先例 = `thincoder-desktop/test/rc-resolve.mjs`（registerHooks 同法）；
 * `./agent-turn.mjs` 替身 = data: URL 模块（经 globalThis 回话——#513 直驱窗内 timer 支）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { createRequire, registerHooks } from "node:module"
import { dirname, join, resolve } from "node:path"
import { pathToFileURL, fileURLToPath } from "node:url"
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..")
const desktopRoot = join(repoRoot, "thincoder-desktop")
const cliRoot = join(repoRoot, "thincoder-cli")
const importFile = (path) => import(pathToFileURL(path).href)

// ── 解析钩子 ─────────────────────────────────────────────────────────────────
const agentTurnStub = "export async function runAgentTurn(ctx, text, opts) { return globalThis.__r6RunAgentTurn(ctx, text, opts) }\n"
const renderCoreRoot = dirname(createRequire(join(desktopRoot, "test/rc-resolve.mjs")).resolve("@thincoder/render-core/package.json"))
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("/rc/")) {
      return { url: pathToFileURL(join(renderCoreRoot, specifier.slice(4))).href, shortCircuit: true }
    }
    if (specifier === "./agent-turn.mjs" && String(context.parentURL ?? "").includes("/tui/suspension-drive.mjs")) {
      return { url: "data:text/javascript," + encodeURIComponent(agentTurnStub), shortCircuit: true }
    }
    return nextResolve(specifier, context)
  },
})

// ── #425：长驻两面根属性名集零增（通则：「挂载期属性集只增 = 红」）─────────────────

/** 零增判据：后帧名集 ⊆ 基帧名集 ∧ 并集 == 基帧集（任何新增 ⇒ 抛）。 */
function assertZeroGrowth(frameSets, label) {
  const base = new Set(frameSets[0])
  for (const frame of frameSets) {
    for (const name of frame) {
      assert.ok(base.has(name), `${label}：基帧集外属性名「${name}」新增——挂载期属性集只增 = 红`)
    }
  }
  assert.deepEqual([...new Set(frameSets.flat())].sort(), [...base].sort(), `${label}：并集 == 基帧集（零增）`)
  return base
}

const chatStates = [
  { activeSession: null },
  { activeSession: 1, blocks: [], history: {} },
  { activeSession: 1, blocks: [{ kind: "user", text: "hi" }], history: {}, following: true },
  {
    activeSession: 1,
    blocks: [{ kind: "assistant", text: "yo", streaming: true }, { kind: "tool", name: "read", status: "running", result: "" }],
    history: { hasOlder: true, inFlight: true },
    following: false,
    pendingNew: 3,
    stopMark: { 1: true },
    ledgerLines: { 1: [{ text: "ledger line", warn: false }] },
    digest: { 1: { status: "start", n: 2 } },
    timerNotice: { 1: { text: "⏰ probe" } },
    settings: { configured: true },
    locale: "zh",
  },
]

const poolStates = [
  { activeSession: null },
  { activeSession: 1, pool: {} },
  {
    activeSession: 1,
    pool: { running: 1, approval: 0, approvals: [{ id: "p1" }], queue: [{ id: "q1", title: "queued turn", status: "queued" }] },
    subBlocks: { 1: [{ id: "s1", region: "pool", role: "explore", status: "running" }] },
  },
]

test("r6-#425 chat 长驻面：根属性名集跨帧零增（chromeProps 四名）", async () => {
  const { chatModel, chatTree } = await importFile(join(desktopRoot, "renderer/views/chat.mjs"))
  const frameSets = chatStates.map((state) => Object.keys(chatTree(chatModel(state), {}).props ?? {}))
  const base = assertZeroGrowth(frameSets, "chat")
  assert.deepEqual([...base].sort(), ["data-blocks", "data-following", "data-hidden", "data-state"], "chat 根属性 = chromeProps 四名")
})

test("r6-#425 activity 长驻面：根属性名集跨帧零增（池树两名）", async () => {
  const { poolModel, poolTree } = await importFile(join(desktopRoot, "renderer/views/activity.mjs"))
  const frameSets = poolStates.map((state) => Object.keys(poolTree(poolModel(state), {}).props ?? {}))
  const base = assertZeroGrowth(frameSets, "activity")
  assert.deepEqual([...base].sort(), ["data-pool", "data-state"], "池树根属性 = 两名")
})

test("r6-#425 反证：属性名集新增 ⇒ 判红（检查器有牙，防假绿）", () => {
  assert.doesNotThrow(
    () => assertZeroGrowth([["data-state", "data-pool"], ["data-state", "data-pool"]], "control"),
    /零增/,
    "零增对同集不抛",
  )
  assert.throws(
    () => assertZeroGrowth([["data-state", "data-pool"], ["data-state", "data-pool", "data-extra"]], "control"),
    /只增 = 红/,
    "基帧集外新增 ⇒ 抛（通则断言不空转）",
  )
})

// ── #512：syncLedger 同引用零写 / 换代原位换（最小 DOM 替身）───────────────────

function installDomStub() {
  class NodeBase {}
  class El extends NodeBase {
    constructor(tag) {
      super()
      this.tag = tag
      this.attrs = {}
      this.children = []
      this.parent = null
    }
    setAttribute(name, value) { this.attrs[String(name)] = String(value) }
    getAttribute(name) { return this.attrs[String(name)] }
    append(child) { if (child != null) this.children.push(child) }
    remove() { if (this.parent?.ledger === this) this.parent.ledger = null }
    replaceWith(next) {
      if (this.parent?.ledger === this) { this.parent.writes += 1; this.parent.ledger = next; next.parent = this.parent }
    }
    addEventListener() {}
    querySelector() { return null }
  }
  globalThis.Node = NodeBase
  globalThis.document = { createElement: (tag) => new El(tag) }
}

function makeChromeRoot() {
  return {
    ledger: null,
    writes: 0,
    attrs: {},
    setAttribute(name, value) { this.attrs[String(name)] = String(value) },
    querySelector(selector) { return String(selector) === "[data-ledger]" ? this.ledger : null },
    insertBefore(node) { this.writes += 1; this.ledger = node; node.parent = this },
    append(node) { this.writes += 1; this.ledger = node; node.parent = this },
  }
}

const chromeModel = (ledger) => ({
  state: "flow", blocks: [], hidden: 0, following: true, pendingNew: 0,
  guide: null, approval: [], digest: null, compress: null, timer: null,
  stopped: false, ledger, canRetry: false, configured: false,
})

test("r6-#512 syncLedger：同引用二帧零写（节点身份不变）", async () => {
  installDomStub()
  const { syncChrome } = await importFile(join(desktopRoot, "renderer/views/chat-chrome.mjs"))
  const root = makeChromeRoot()
  const lines = [{ text: "台账行", warn: false }]
  syncChrome(root, chromeModel(lines), {})
  const first = root.ledger
  assert.ok(first, "首帧落组")
  assert.equal(first._ledgerLines, lines, "补写者在场：行集引用随节点携带（#512 收正本体）")
  const writesAfterFirst = root.writes
  syncChrome(root, chromeModel(lines), {})
  assert.equal(root.ledger, first, "同引用二帧 ⇒ 节点身份不变（短路命中，零写）")
  assert.equal(root.writes, writesAfterFirst, "同引用二帧 ⇒ 零 DOM 写")
})

test("r6-#512 syncLedger：引用换代 ⇒ 原位换（新节点携新引用）", async () => {
  installDomStub()
  const { syncChrome } = await importFile(join(desktopRoot, "renderer/views/chat-chrome.mjs"))
  const root = makeChromeRoot()
  const linesA = [{ text: "a", warn: false }]
  const linesB = [{ text: "b", warn: true }]
  syncChrome(root, chromeModel(linesA), {})
  const first = root.ledger
  syncChrome(root, chromeModel(linesB), {})
  assert.notEqual(root.ledger, first, "换代（引用变）⇒ 原位换")
  assert.equal(root.ledger._ledgerLines, linesB, "新节点携新引用")
  syncChrome(root, chromeModel(null), {})
  assert.equal(root.ledger, null, "行集空 ⇒ 摘组")
})

// ── #513：CLI 窗内 timer 支 AbortError 容纳（suspensionSession 直驱）───────────

const abortError = () => Object.assign(new Error("The operation was aborted"), { name: "AbortError" })

function fakeWindowAgent() {
  return {
    config: { agent: {} },
    _asyncSubagents: new Map([["sub-1", { id: "sub-1", status: "running", done: false, role: "explore" }]]),
    _asyncAdvisors: new Map(),
    _consultSessions: new Map(),
    _pendingAsyncResults: [],
    _pendingTimers: [{ id: "t-1", expiresAt: Date.now() - 10, message: "r6 probe" }],
    history: [],
    _suspended: false,
    _sessionAbort: new AbortController(),
    _sessionSignal: null,
    _sessionAbortAll: null,
  }
}

async function driveWindow(agent, turnStub) {
  const { suspensionSession } = await importFile(join(cliRoot, "src/tui/suspension-drive.mjs"))
  globalThis.__r6RunAgentTurn = turnStub
  let fire = null
  const state = { pendingInput: [], subTasks: {}, lines: [], processing: false, suspended: false }
  const lines = []
  const ctx = {
    agent,
    state,
    render() {},
    pushLine(line) { lines.push(line) },
    pushLabel() {},
    timer(cb) { fire = cb; return { unref() {} } },
    clear() {},
  }
  const p = suspensionSession(ctx)
  await Promise.resolve()
  assert.equal(typeof fire, "function", "窗内 deadline 已注册一次性 timer（注入缝）")
  fire()
  return { p, state, lines }
}

test("r6-#513 窗内 timer 支：AbortError ∧ 会话未停 ⇒ 容纳重入（窗自然退出）", async () => {
  const agent = fakeWindowAgent()
  let calls = 0
  const { p, state } = await driveWindow(agent, async () => {
    calls += 1
    agent._asyncSubagents.clear() // 池随本轮清空 ⇒ 重入后步骤 3 自然退出
    throw abortError()
  })
  try {
    await p // 容纳重入 ⇒ 窗以 idle 自然退出（未炸窗、未拒）
  } finally {
    globalThis.__r6RunAgentTurn = undefined
  }
  assert.equal(calls, 1, "timer 轮开启恰一次")
  assert.equal(agent._pendingTimers.length, 0, "到期件已出列（本窗兑现）")
  assert.equal(agent.history.length, 1, "到期件注入历史恰一条")
  assert.match(String(agent.history[0].content), /⏰ timer/, "注入 = timer 提醒逐字形态")
  assert.equal(state.status, "Ready", "finally 清场归位")
  assert.equal(agent._suspended, false, "finally 复位挂起位")
})

test("r6-#513 窗内 timer 支：AbortError ∧ 会话已停 ⇒ 照旧上抛", async () => {
  const agent = fakeWindowAgent()
  let calls = 0
  const { p } = await driveWindow(agent, async () => {
    calls += 1
    agent._sessionAbort.abort({ abortTrigger: "stop", abortDetail: "session-stop" })
    throw abortError()
  })
  try {
    await assert.rejects(p, (e) => e?.name === "AbortError", "会话停 ⇒ 不上抛豁免（照旧抛出）")
  } finally {
    globalThis.__r6RunAgentTurn = undefined
  }
  assert.equal(calls, 1, "timer 轮开启恰一次（抛出前）")
})

// ── #382：/advisor guard 槽单写（toggle 零 config 写；persist 写面不携 guard）────

test("r6-#382 /advisor guard：槽单写（toggle 不触 config 写）+ persist 写面不携 guard", async () => {
  const slots = await import(pathToFileURL(createRequire(join(cliRoot, "src/tui/cmd-advisor.mjs")).resolve("@thincoder/core/session-slots.mjs")).href)
  const { handleAdvisorCommand } = await importFile(join(cliRoot, "src/tui/cmd-advisor.mjs"))
  const tmp = mkdtempSync(join(tmpdir(), "r6-closeout-"))
  slots._setSessionsDirForTest(tmp)
  try {
    const cwd = join(tmp, "proj")
    mkdirSync(cwd, { recursive: true })
    const slot = "1"
    const p = slots.slotPath(cwd, slot)
    assert.ok(String(p).startsWith(tmp), "槽路径命中测试注入目录（seam 生效）")
    mkdirSync(dirname(p), { recursive: true })
    writeFileSync(p, JSON.stringify({ version: 2, cwd, history: [], advisor: null }), "utf8")

    const agent = { cwd, _slot: slot, config: {}, provider: { model: "probe-model" } }
    const persistCalls = []
    const picks = [{ action: "guard" }, { action: "thinking" }, { action: "inherit" }, null]
    const ctx = {
      agent,
      showPicker: async () => picks.shift() ?? null,
      pushLine() {},
      pushLabel() {},
      persistRaw: async (mutate) => { const raw = { agent: {} }; mutate(raw); persistCalls.push(raw) },
    }
    await handleAdvisorCommand(ctx)

    const onDisk = JSON.parse(readFileSync(p, "utf8"))
    assert.equal(onDisk.advisor?.guard, true, "guard 落槽（槽 = 权威）")
    assert.equal(agent.config.advisor.guard, true, "内存态同值（本会话生效）")
    assert.equal(persistCalls.length, 1, "恰一次 config 写 = thinking-inherit 径；guard toggle 零 config 写（#382 收正本体）")
    const advisorWritten = persistCalls[0].agent.advisor ?? {}
    assert.ok(!("guard" in advisorWritten), "config 写面不携 guard（槽唯一权威）")
    assert.ok(!("enabled" in advisorWritten), "退役键 enabled 不复活")
  } finally {
    slots._resetSessionsDirForTest()
    rmSync(tmp, { recursive: true, force: true })
  }
})
