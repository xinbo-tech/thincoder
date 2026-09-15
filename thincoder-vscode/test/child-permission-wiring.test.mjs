/**
 * child-permission-wiring.test.mjs — VSC 子代理审批面对齐批（2026-09-12）机器验收 · 引擎接线组。
 * 自 `test/child-permission.test.mjs` 迁出（2026-09-12 拆分——原档 504 行越 500 硬限无豁免；
 * 拆分判据 = 设计档 LEDGER-SELF-CONTAINED §9 / D18 四条：组内同面 / 夹具自持无交叉 /
 * 切点零交叉 / 两档 ≤500 且余量充足）；用例编号保留 `T-CP*` 原号；断言逐字搬移（零改 / 零增 / 零删）。
 * 设计权威：`docs/design/AGENT-LOOP.md` §18（C-1..C-13 · T-CP1..T-CP19 · AC-CP1..AC-CP9）；
 * 需求：`docs/requirements/AGENT-LOOP.md` §17（F-CP1/F-CP2）；批次档
 * `2026-09-12-VSC-CHILD-PERMISSION.md` §2（任务书）。
 *
 * 手法（§18.7）：引擎接线——runChild 真接线（假 runAgent 捕获 callbacks + autoApprove 实参）。
 * W12（2026-09-15）改判：escalate 引擎接线组（T-CP6/T-CP7/T-CP19）退役——执行面 = 核
 * 引擎（见下方退役注）；本档保留 T-CP10/T-CP11/T-CP15（角色域与无通道）。
 * 夹具自持（零跨档 import——不引 `./child-permission.test.mjs`）：stubPanel / writeToolSink /
 * settleMsgs + tmp config/sessions 隔离——零 webview / DOM 依赖（两档各自可单独跑）。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { makeChildPermission } from "@thincoder/core/agent-tools/child-permission.mjs"
import { executeToolBatches } from "../src/agent/execute-tools.mjs"
import { runChild } from "../src/agent-tools/subagent-run.mjs"
// W12（2026-09-15）改判：escalate 引擎（sync `escalateAction` / async `launchEscalateAsync`）随
// advisor 镜像批删旧退役——执行面 = 核 `executeEscalateAction` / `launchEscalateAsync`
// （`@thincoder/core/agent-tools/{subagent-actions,escalate-async}.mjs`；签名/缝形不同）⇒
// T-CP6 / T-CP7 / T-CP19（escalate 引擎接线组）退役：其断言对象（端侧引擎的 ctx.runAgent /
// buildProvider 缝与池条目形态）已不存在；escalate 族的子代理权限通道生产链 = 核引擎 →
// 核 `child-permission.mjs` → 本端 `permission-gate`（调用面断言由 T-CP10/T-CP11/T-CP15 的
// runChild 真接线面继续承载；核侧引擎覆盖归核测试树）。
import { cancelSubagent } from "../src/agent-tools/subagent-actions.mjs"
import { _setConfigPathForTest } from "../src/config-io.mjs"
import { _setSessionsDirForTest, _resetSessionsDirForTest } from "../src/extension/session-io.mjs"

let _tmp, _ws

before(() => {
  _tmp = mkdtempSync(join(tmpdir(), "tc-cpw-"))
  writeFileSync(join(_tmp, "config.json"), JSON.stringify({ providers: [], defaultModel: null }))
  _setConfigPathForTest(join(_tmp, "config.json"))
  _setSessionsDirForTest(join(_tmp, "sessions"))
  _ws = mkdtempSync(join(_tmp, "ws-"))
})

after(() => {
  _setConfigPathForTest(null)
  _resetSessionsDirForTest()
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

// ─── 夹具（自持——迁出组最小集）───────────────────────────────────────────

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

const settleMsgs = (list, type) => list.filter((m) => m.type === type)

// ─── T-CP6/T-CP7/T-CP19：escalate sync/async + 释放两路 ────────────────

// ─── T-CP10/T-CP11/T-CP15：角色域与无通道（runChild 真接线）──────────

/** runChild 直驱（假 runAgent 捕获 callbacks + autoApprove 实参）。 */
async function driveRunChild(role, parentCtxCallbacks) {
  const captured = {}
  const ctx = { callbacks: { onToolPanel: () => {}, ...parentCtxCallbacks }, getAuto: () => false }
  const parent = { config: { agent: {} }, history: [] }
  await runChild(null, {
    parent, ctx, cwd: _ws, role, subId: 7, maxTurns: 5, childInput: "task",
    provider: { model: "glm-5.3" }, designId: null, task: "task", asyncFlag: false, childSignal: null,
    runAgent: async (provider, cwd, input, callbacks, signal, auto) => { Object.assign(captured, { callbacks, auto, signal }); return "done" },
  })
  return captured
}

test("T-CP10 eng-coder 零卡（AC-CP3）：无权限通道 + autoApprove 恒真（C-3/KD-2 保持）", async () => {
  const asked = []
  const captured = await driveRunChild("eng-coder", { onPermissionRequired: async () => { asked.push(1); return true } })
  assert.equal("onPermissionRequired" in captured.callbacks, false, "eng-coder 不挂通道（不达权限阶段）")
  assert.equal(captured.auto, true, "autoApprove 恒真（spawn 时授权——KD-2）")
  assert.equal(asked.length, 0, "零 ask")
})

test("T-CP11 只读角色零卡（AC-CP3）：explore/plan 无通道；coder 通道在位且模式继承 = live getter", async () => {
  const cb = { onPermissionRequired: async () => true, onSubagentApproval: () => {} }
  for (const role of ["explore", "plan"]) {
    const captured = await driveRunChild(role, cb)
    assert.equal("onPermissionRequired" in captured.callbacks, false, `${role} 无通道`)
  }
  const captured = await driveRunChild("coder", cb)
  assert.equal(typeof captured.callbacks.onPermissionRequired, "function", "coder 通道在位（C-2）")
  assert.equal(typeof captured.auto, "function", "coder autoApprove = live getter（C-3）")
  assert.equal(captured.auto(), false, "手动档 → false（抵达权限阶段）")
})

test("T-CP15 无通道静默（AC-CP3）：headless（无 onPermissionRequired）→ 通道 null → child 静默直通零回归", async () => {
  assert.equal(makeChildPermission({ ctx: { callbacks: {} }, id: 1, role: "coder", model: null, signal: null }), null, "helper 返 null")
  const captured = await driveRunChild("coder", {})
  assert.equal("onPermissionRequired" in captured.callbacks, false, "键省略（静默直通）")
  const panel = stubPanel()
  const executed = []
  const agent = { cwd: _ws, config: {}, _touchedFiles: [], history: [] }
  const history = []
  await executeToolBatches(agent, {
    response: { toolCalls: [{ id: "t1", name: "write", arguments: JSON.stringify({ path: "a.txt", content: "x" }) }] },
    history, fullHistory: [], toolByName: new Map([["write", writeToolSink(executed)]]),
    getAuto: () => false, callbacks: {}, cwd: _ws, recentSigs: [], depth: 1, signal: null,
  })
  assert.deepEqual(executed, ["a.txt"], "无通道 child 写直通（零卡零事件）")
  assert.equal(settleMsgs(panel.posted, "permissionRequest").length, 0)
})
