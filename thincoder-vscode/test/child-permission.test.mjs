/**
 * child-permission.test.mjs — VSC 子代理审批面对齐批（2026-09-12）机器验收。
 * 设计权威：`docs/design/AGENT-LOOP.md` §18（C-1..C-13 · T-CP1..T-CP19 · AC-CP1..AC-CP9）；
 * 需求：`docs/requirements/AGENT-LOOP.md` §17（F-CP1/F-CP2）；批次档
 * `2026-09-12-VSC-CHILD-PERMISSION.md` §2（任务书）。
 *
 * 手法（§18.7）：host 直驱（permission-gate / panel-messages + panel 假体——`test/chat-panel-messages.test.mjs`
 * 模式）+ webview 面（installChatFixture + 真 activity/activity-view/permission——
 * activity-closure 模式）+ fs 直读（i18n）。
 * 引擎接线组（T-CP6/T-CP7/T-CP19/T-CP10/T-CP11/T-CP15）迁 `test/child-permission-wiring.test.mjs`
 * （2026-09-12 拆分——500 行硬限无豁免）。
 * 2026-09-12 PROSE-ANCHOR-RETIRE：T-CP17（R2 措辞锚——读 docs/design/*.md 文本）整删 +
 * T-CP18 段删（函数名 src grep；对拍行随 advisor-guard-completion T-VG19 段删同步退场——批次档 §5）。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { setupWebview, installChatFixture } from "./helpers/webview-env.mjs"
import { permissionGate, batchPermissionGate } from "../src/extension/permission-gate.mjs"
import { handlePanelMessage } from "../src/extension/panel-messages.mjs"
import { makeChildPermission } from "@thincoder/core/agent-tools/child-permission.mjs"
import { executeToolBatches } from "../src/agent/execute-tools.mjs"
import { _setConfigPathForTest } from "../src/config-io.mjs"
import { _setSessionsDirForTest, _resetSessionsDirForTest } from "../src/extension/session-io.mjs"

let _tmp, _ws, _capturedPosts, _cleanupEnv

before(() => {
  const env = setupWebview()
  _cleanupEnv = env.cleanup
  _capturedPosts = env.capturedPosts
  installChatFixture()
  _tmp = mkdtempSync(join(tmpdir(), "tc-cp-"))
  writeFileSync(join(_tmp, "config.json"), JSON.stringify({ providers: [], defaultModel: null }))
  _setConfigPathForTest(join(_tmp, "config.json"))
  _setSessionsDirForTest(join(_tmp, "sessions"))
  _ws = mkdtempSync(join(_tmp, "ws-"))
})

after(() => {
  _setConfigPathForTest(null)
  _resetSessionsDirForTest()
  try { window.dispatchEvent(new window.Event("unload")) } catch { /* happy-dom teardown edge */ }
  _cleanupEnv()
  try { rmSync(_tmp, { recursive: true, force: true }) } catch { /* ignore */ }
})

const sleep = (ms = 5) => new Promise((r) => setTimeout(r, ms))
async function until(cond, ms = 1500) {
  const t0 = Date.now()
  while (!cond()) {
    if (Date.now() - t0 > ms) throw new Error("until: timeout")
    await sleep(5)
  }
}

// ─── 夹具 ────────────────────────────────────────────────────────────────

/** panel 假体（`test/chat-panel-messages.test.mjs` 模式 + 本批字段：_permissionSeq / _autoApprove / _setAutoApprove）。 */
function stubPanel(overrides = {}) {
  const posted = []
  const p = {
    _autoApprove: false,
    _permissionQueue: [],
    _permissionSeq: 0,
    _abortController: null,
    _setStatus() {},
    _refreshStatus() {},
    _panel: { webview: { postMessage: (m) => { posted.push(m) } } },
    async _setAutoApprove(v) { p._autoApprove = v },
    posted,
    ...overrides,
  }
  return p
}

/** 写工具桩（无 fs 落地——executed 记录执行事实）。 */
function writeToolSink(executed) {
  return {
    name: "write",
    touchedPaths: (a) => [a.path],
    execute: async (a) => { executed.push(a.path); return `Wrote ${a.path}` },
  }
}

/** child 侧写驱动（真 executeToolBatches——depth 1 + child 权限通道）。 */
async function driveChildWrite(panel, { getAuto = () => false, calls = 1, childId = 5 } = {}) {
  const approvals = []
  const executed = []
  const parentCallbacks = {
    onPermissionRequired: permissionGate(panel),
    onSubagentApproval: (i) => approvals.push(i),
  }
  const childPerm = makeChildPermission({ ctx: { callbacks: parentCallbacks }, id: childId, role: "coder", model: null, signal: null })
  const agent = { cwd: _ws, config: {}, _touchedFiles: [], history: [] }
  const toolCalls = Array.from({ length: calls }, (_, i) => ({ id: `t${i}`, name: "write", arguments: JSON.stringify({ path: `f${i}.txt`, content: "x" }) }))
  const history = []
  const run = executeToolBatches(agent, {
    response: { toolCalls }, history, fullHistory: [],
    toolByName: new Map([["write", writeToolSink(executed)]]),
    getAuto, callbacks: { onPermissionRequired: childPerm }, cwd: _ws, recentSigs: [], depth: 1, signal: null,
  })
  return {
    run, approvals, executed,
    results: () => history.filter((m) => m.role === "tool").map((m) => m.content),
    reqs: () => panel.posted.filter((m) => m.type === "permissionRequest"),
  }
}

async function loadActivity() {
  const state = await import("../webview/state.js")
  const activity = await import("../webview/activity.js")
  const i18n = await import("../webview/i18n.js")
  return { S: state.S, ctx: state.ctx, t: i18n.t, ...activity }
}

function fresh({ S, ctx }) {
  ctx.messagesEl.replaceChildren()
  ctx.activityEl.replaceChildren()
  S._subBlocks.clear()
  S._subDescShown = true
}

const hdrOf = (block) => block.querySelector(".sub-hdr").textContent
const settleMsgs = (list, type) => list.filter((m) => m.type === type)

// ─── T-CP1：ask 弹卡带归属 + 通道 announce 顺序 + 块头 ⏸ ────────────────

test("T-CP1 ask 弹卡带归属（F-CP1/AC-CP1）：卡含 owner 逐字 + promptId；announce→ask→清态；块头 ⏸ + 态词", async () => {
  const panel = stubPanel()
  const gate = permissionGate(panel)
  const ask = gate("write", { path: "a.txt", content: "x" }, null, { owner: { label: "coder#1", role: "coder", id: 1 }, signal: null })
  const req = settleMsgs(panel.posted, "permissionRequest")[0]
  assert.equal(req.owner, "coder#1", "卡归属 = owner label（逐字）")
  assert.equal(typeof req.promptId, "number", "promptId 随卡（C-4）")
  assert.equal(panel._permissionQueue.length, 1, "队列条目 {id, resolve, toolName, owner}")

  // 通道顺序定死（C-2）：announce(tool) → ask → finally announce(null)
  const events = []
  const ctx = { callbacks: {
    onSubagentApproval: (i) => events.push(`approval:${i.tool ?? "null"}`),
    onPermissionRequired: (tool, args, diff, opts) => { events.push(`ask:${opts.owner.label}:${opts.signal === null}`); return true },
  } }
  const perm = makeChildPermission({ ctx, id: 1, role: "coder", model: "glm-5.3", signal: null })
  assert.equal(await perm("write", {}, null), true)
  assert.deepEqual(events, ["approval:write", "ask:coder#1:true", "approval:null"], "顺序 = announce → ask → 清态")

  // webview 面：卡首行 = `{owner} · {tool}`（逐字）+ data-prompt-id；approve 响应携 promptId
  const { showPermissionRequest } = await import("../webview/permission.js")
  showPermissionRequest({ tool: "write", args: "{}", promptId: 7, owner: "coder#1" })
  const card = [...document.querySelectorAll(".permission-prompt")].at(-1)
  assert.equal(card.dataset.promptId, "7", "卡携 data-prompt-id（C-7）")
  assert.ok(card.querySelector(".permission-prompt-text").textContent.startsWith("coder#1 · write"), "卡首行逐字 `{owner} · {tool}`")
  card.querySelector(".approve").click()
  assert.deepEqual(_capturedPosts.at(-1), { type: "permissionResponse", approved: true, promptId: 7 }, "响应携 promptId（C-5）")

  // 块头 ⏸ + 态词（C-8）
  const { S, ctx: actx, ensureBlock, applySubagentApproval, t } = await loadActivity()
  fresh({ S, ctx: actx })
  const block = ensureBlock("sub:coder#2")
  applySubagentApproval({ role: "coder", id: 2, model: null, tool: "write" })
  assert.ok(hdrOf(block).includes("⏸"), "块头 icon ⏸（覆盖 ▶）")
  assert.ok(hdrOf(block).includes(t("sub.awaitingApproval", { tool: "write" })), "态词 `等待审批: write`（locale 渲染）")

  await handlePanelMessage(panel, { type: "permissionResponse", approved: true, promptId: req.promptId })
  assert.equal(await ask, true, "approve → resolve(true)")
  assert.equal(panel._permissionQueue.length, 0)
})

// ─── T-CP2/T-CP3：approve 继续 / deny 语义（executeToolBatches 集成）───

test("T-CP2 approve 后 child 继续（AC-CP1）：队列条目 resolve(true) → 工具执行；finally 清态", async () => {
  const panel = stubPanel()
  const d = await driveChildWrite(panel)
  await until(() => panel._permissionQueue.length === 1)
  await handlePanelMessage(panel, { type: "permissionResponse", approved: true, promptId: panel._permissionQueue[0].id })
  await d.run
  assert.deepEqual(d.executed, ["f0.txt"], "approve → 工具执行")
  assert.ok(!d.results()[0].includes("Denied"), "工具结果非拒绝串")
  assert.equal(d.approvals.length, 2, "announce(tool) + 清态")
  assert.equal(d.approvals[1].tool, null, "块头态词清除（tool:null）")
  assert.equal(panel._permissionQueue.length, 0, "出队")
})

test("T-CP3 deny 语义（AC-CP1）：resolve(false) → 工具结果 = `Denied by user (permission mode).`（与 CLI/顶层同串）", async () => {
  const panel = stubPanel()
  const d = await driveChildWrite(panel)
  await until(() => panel._permissionQueue.length === 1)
  await handlePanelMessage(panel, { type: "permissionResponse", approved: false, promptId: panel._permissionQueue[0].id })
  await d.run
  assert.equal(d.results()[0], "Denied by user (permission mode).", "拒绝串逐字（顶层同串）")
  assert.deepEqual(d.executed, [], "deny → 零执行")
})

// ─── T-CP4/T-CP5：模式继承（AUTO 直通 / 轮中 approve-all）────────────

test("T-CP4 AUTO 直通（AC-CP2）：getAuto() 真 → child 写零卡零 approval 事件、工具执行", async () => {
  const panel = stubPanel()
  const d = await driveChildWrite(panel, { getAuto: () => true })
  await d.run
  assert.equal(d.reqs().length, 0, "零卡")
  assert.equal(d.approvals.length, 0, "零 approval 事件（通道未被触发）")
  assert.deepEqual(d.executed, ["f0.txt"], "工具执行（直通）")
})

test("T-CP5 轮中 approve-all（AC-CP1/AC-CP2）：全队列放行 + AUTO 置位 + 其余卡 permissionWithdrawn；后续 child 写零卡", async () => {
  const panel = stubPanel()
  const gate = permissionGate(panel)
  const o = (id) => ({ owner: { label: `coder#${id}`, role: "coder", id }, signal: null })
  const a1 = gate("write", {}, null, o(1))
  const a2 = gate("edit", {}, null, o(2))
  const ids = panel._permissionQueue.map((e) => e.id)
  await handlePanelMessage(panel, { type: "permissionResponse", approved: "approveAll", promptId: ids[1] })
  assert.equal(await a2, true, "被点卡 resolve(true)")
  assert.equal(await a1, true, "其余 pending 全放行（既有语义）")
  assert.equal(panel._autoApprove, true, "AUTO 置位")
  const wd = settleMsgs(panel.posted, "permissionWithdrawn")
  assert.deepEqual(wd.map((m) => m.promptId), [ids[0]], "其余 pending 逐卡 permissionWithdrawn（无残卡）")
  assert.equal(panel._permissionQueue.length, 0, "队列清空")
  const before = panel.posted.length
  assert.equal(await gate("write", {}, null, o(3)), true, "后续 child 写零卡（live re-check）")
  assert.equal(panel.posted.length, before, "零新卡（AUTO 短路）")
})

// ─── T-CP8/T-CP9：响应路由（promptId 精确 / 回退 / 陈旧）──────────────

test("T-CP8 双 child 路由（AC-CP6）：两卡并存先点第二张 → 按 promptId 命中该条目（非队头）", async () => {
  const panel = stubPanel()
  const gate = permissionGate(panel)
  const o = (id) => ({ owner: { label: `coder#${id}`, role: "coder", id }, signal: null })
  const a1 = gate("write", {}, null, o(1))
  const a2 = gate("edit", {}, null, o(2))
  const [id1, id2] = panel._permissionQueue.map((e) => e.id)
  await handlePanelMessage(panel, { type: "permissionResponse", approved: true, promptId: id2 })
  assert.equal(await a2, true, "第二张命中（promptId 匹配）")
  assert.equal(panel._permissionQueue.length, 1, "第一张仍在队")
  assert.equal(panel._permissionQueue[0].id, id1)
  await handlePanelMessage(panel, { type: "permissionResponse", approved: false, promptId: id1 })
  assert.equal(await a1, false, "第一张 deny 各归其位")
})

test("T-CP9 陈旧/无 id 响应（AC-CP6）：无 promptId → 回退队头；未知 promptId → no-op（零 resolve）", async () => {
  const panel = stubPanel()
  const gate = permissionGate(panel)
  const a = gate("write", {}, null, { owner: { label: "coder#1", role: "coder", id: 1 }, signal: null })
  const b = gate("edit", {}, null, { owner: { label: "coder#2", role: "coder", id: 2 }, signal: null })
  await handlePanelMessage(panel, { type: "permissionResponse", approved: true }) // 无 promptId（旧 webview 形态）
  assert.equal(await a, true, "回退队头（历史语义）")
  let settled = false
  b.then(() => { settled = true })
  await handlePanelMessage(panel, { type: "permissionResponse", approved: true, promptId: 99999 })
  await sleep(10)
  assert.equal(settled, false, "未知 promptId → no-op（不误 resolve）")
  assert.equal(panel._permissionQueue.length, 1, "队列未被错误 shift")
  await handlePanelMessage(panel, { type: "permissionResponse", approved: true, promptId: panel._permissionQueue[0].id })
  assert.equal(await b, true)
})

// ─── T-CP12：depth-0 零回归（顶层逐项 + 批合并原样）────────────────────

test("T-CP12 depth-0 零回归（AC-CP3）：既有 3 参调用 → owner null 卡 + promptId 路由；批合并通道原样聚合", async () => {
  const panel = stubPanel()
  const gate = permissionGate(panel)
  const ask = gate("write", { path: "a" }, null) // 既有调用形态（不传第 4 参）
  const req = settleMsgs(panel.posted, "permissionRequest")[0]
  assert.equal(req.owner, null, "owner 空 → 既有句零改（webview 走 wantsTo 分支）")
  assert.equal(typeof req.promptId, "number", "promptId 向后兼容新增")
  await handlePanelMessage(panel, { type: "permissionResponse", approved: true, promptId: req.promptId })
  assert.equal(await ask, true)

  // 批合并（§16 D-B1）零回归：depth 0 两写 → 一次聚合（approveAll → 零逐项卡）
  const bpanel = stubPanel()
  const batches = []
  const executed = []
  const agent = { cwd: _ws, config: {}, _touchedFiles: [], history: [] }
  const history = []
  const run = executeToolBatches(agent, {
    response: { toolCalls: [
      { id: "t0", name: "write", arguments: JSON.stringify({ path: "b0.txt", content: "x" }) },
      { id: "t1", name: "write", arguments: JSON.stringify({ path: "b1.txt", content: "x" }) },
    ] },
    history, fullHistory: [], toolByName: new Map([["write", writeToolSink(executed)]]),
    getAuto: () => false, cwd: _ws, recentSigs: [], depth: 0, signal: null,
    callbacks: {
      onPermissionRequired: permissionGate(bpanel),
      onBatchPermissionRequest: (r) => { batches.push(r); return "approveAll" },
    },
  })
  await until(() => batches.length === 1)
  assert.equal(batches[0].count, 2, "批合并聚合（既有语义）")
  await run
  assert.equal(executed.length, 2, "approveAll → 全批执行")
  assert.equal(settleMsgs(bpanel.posted, "permissionRequest").length, 0, "批通过无逐项卡")
  // 批 gate 形态不变（消息 + 响应路由）
  const bp = stubPanel()
  const bAsk = batchPermissionGate(bp)({ tools: [{ name: "write" }], count: 1 })
  assert.equal(settleMsgs(bp.posted, "batchPermissionRequest")[0].count, 1, "批消息形态不变")
  await handlePanelMessage(bp, { type: "batchPermissionResponse", choice: "deny" })
  assert.equal(await bAsk, "deny", "批响应路由不变")
})

// ─── T-CP14：child 多写逐项两卡（批合并零进入——Q1）─────────────────

test("T-CP14 child 多写（AC-CP6）：单响应 ≥2 非只读工具 → 逐项两卡（批合并分支零进入——Q1）", async () => {
  const panel = stubPanel()
  const d = await driveChildWrite(panel, { calls: 2 })
  await until(() => panel._permissionQueue.length === 1)
  assert.equal(d.reqs().length, 1, "第一张卡出现（逐项）")
  await handlePanelMessage(panel, { type: "permissionResponse", approved: true, promptId: panel._permissionQueue[0].id })
  await until(() => panel._permissionQueue.length === 1)
  await handlePanelMessage(panel, { type: "permissionResponse", approved: true, promptId: panel._permissionQueue[0].id })
  await d.run
  assert.equal(d.reqs().length, 2, "逐项两卡（同响应两写——非合并）")
  assert.equal(settleMsgs(panel.posted, "batchPermissionRequest").length, 0, "批合并分支零进入（child 不入批——Q1）")
  assert.deepEqual(d.executed, ["f0.txt", "f1.txt"], "两写逐项批准后执行")
  assert.equal(d.approvals.length, 4, "announce/清态 ×2")
})

// ─── T-CP13/T-CP16：冻结丢弃 / 清态 + i18n ─────────────────────────────

test("T-CP13 冻结块迟来审批事件（AC-CP5）：丢弃（meta 零写、零复活）", async () => {
  const { S, ctx, ensureBlock, applySubagentStatus, applySubagentApproval } = await loadActivity()
  fresh({ S, ctx })
  const block = ensureBlock("sub:coder#9")
  applySubagentStatus({ role: "coder", id: 9, status: "done" })
  assert.equal(block._subMeta.frozen, true, "已冻结（归档）")
  applySubagentApproval({ role: "coder", id: 9, model: null, tool: "write" })
  assert.equal(block._subMeta.approval, null, "冻结块零写（幂等守卫同族）")
  assert.ok(!hdrOf(block).includes("⏸"), "头词零复活")
  // 未知块（无 map 条目）→ 绝不建块
  const n = S._subBlocks.size
  applySubagentApproval({ role: "coder", id: 404, model: null, tool: "write" })
  assert.equal(S._subBlocks.size, n, "查块绝不建块")
})

test("T-CP16 态词清除 + i18n（AC-CP5）：tool:null 清态回落；两 locale 键在位且插值正确", async () => {
  const { S, ctx, ensureBlock, applySubagentApproval, t } = await loadActivity()
  fresh({ S, ctx })
  const block = ensureBlock("sub:coder#4")
  applySubagentApproval({ role: "coder", id: 4, model: null, tool: "edit" })
  assert.ok(hdrOf(block).includes("⏸") && hdrOf(block).includes(t("sub.awaitingApproval", { tool: "edit" })))
  applySubagentApproval({ role: "coder", id: 4, model: null, tool: null })
  assert.equal(block._subMeta.approval, null, "meta 清态")
  const hdr = hdrOf(block)
  assert.ok(!hdr.includes("⏸"), "icon 回落 ▶")
  assert.ok(hdr.includes("▶"), "live 态 ▶ 回归")
  assert.ok(!hdr.includes(t("sub.awaitingApproval", { tool: "edit" })), "态词回落（chunk 态/thinking…）")
  // locale 两档（fs 直读 + 插值）
  const en = JSON.parse(readFileSync(new URL("../locales/en.json", import.meta.url), "utf8"))
  const zh = JSON.parse(readFileSync(new URL("../locales/zh.json", import.meta.url), "utf8"))
  assert.equal(en["sub.awaitingApproval"], "Awaiting approval: ${tool}", "en 键逐字")
  assert.equal(zh["sub.awaitingApproval"], "等待审批: ${tool}", "zh 键逐字（CLI 面板同文）")
  assert.equal(t("sub.awaitingApproval", { tool: "write" }), "Awaiting approval: write", "插值生效（运行时 en）")
})

// ─── T-CP18：结构（AC-CP8 / N-CP2）────────────────────────────────────

test("T-CP18 结构（AC-CP8）：execute-tools ≤500、tool-gates ≤300", () => {
  const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8")
  const lines = (s) => s.split("\n").length
  const exec = read("../src/agent/execute-tools.mjs")
  const gates = read("../src/agent/tool-gates.mjs")
  assert.ok(lines(exec) <= 500, `execute-tools ≤500（实到 ${lines(exec)}）`)
  assert.ok(lines(gates) <= 300, `tool-gates ≤300（实到 ${lines(gates)}）`)
})
