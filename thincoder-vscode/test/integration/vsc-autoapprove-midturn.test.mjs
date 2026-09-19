/**
 * vsc-autoapprove-midturn.test.mjs — ED-2（VSC 自动审批·同轮翻转 live 判定）机器验收。
 *
 * 设计权威：`thincoder-cli/docs/design/TOOLS.md` §8（live-fact 语言 + 选型表——父级与子代同判据单源）；
 * 批次档 `2026-09-16-vsc-autoapprove-misalign.md` §2.8（ED-2 任务书）。
 *
 * 缺陷本体：permissionGate / batchPermissionGate 在**构建期**读 `panel._autoApprove` 并早退
 * 返回 undefined（AUTO 开 ⇒ 父门缺席）——同轮内点 AUTO / approve-all 翻转后，其余工具调用
 * 仍按构建期快照判；子代经父门继承同一半 live 缺口。修复 = 删两构建期早退，判定恒为
 * **询问时 live 读**（同轮翻转立即生效，父级与子代同读 panel._autoApprove）。
 *
 * 判据：① 构建期 AUTO 开、同轮内关 ⇒ 父级写工具出卡（permissionRequest ≥1，工具搁置）；
 * ② 构建期 AUTO 关、同轮内开 ⇒ 父级写工具零询问直通；
 * ③ 同一翻转下父级与子代同判据（开态双零卡 / 关态双出卡——同一 live 值）；
 * ④ CLI 侧口径对齐（只核不改）：`thincoder-cli/src/tui/interaction.mjs:58-72` askPermission
 * 构建期零读、询问时读 `agent.autoApprove`——无构建期早退形态（实现轮实读复核，落批次档 §5）。
 *
 * 手法：host 直驱（permission-gate 假体 + 真 executeToolBatches——`child-permission.test.mjs`
 * 同族）；零 webview 面（无 DOM 断言）。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { _setConfigPathForTest } from "@thincoder/core/config.mjs"
import { makeChildPermission } from "@thincoder/core/agent-tools/child-permission.mjs"
import { permissionGate } from "../../src/extension/permission-gate.mjs"
import { executeToolBatches } from "../../src/agent/execute-tools.mjs"

let _tmp

before(() => {
  _tmp = mkdtempSync(join(tmpdir(), "tc-midturn-"))
  writeFileSync(join(_tmp, "config.json"), JSON.stringify({ providers: [], defaultModel: null }))
  _setConfigPathForTest(join(_tmp, "config.json"))
})

after(() => {
  _setConfigPathForTest(null)
  try { rmSync(_tmp, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 }) } catch { /* OS temp — best effort */ }
})

const sleep = (ms = 5) => new Promise((r) => setTimeout(r, ms))
async function until(cond, ms = 1500) {
  const t0 = Date.now()
  while (!cond()) {
    if (Date.now() - t0 > ms) throw new Error("until: timeout")
    await sleep(5)
  }
}

/** panel 假体（`child-permission.test.mjs` 同族）：`_autoApprove` 为唯一 live 判定源。 */
function stubPanel(auto) {
  const posted = []
  return {
    _autoApprove: auto,
    _permissionQueue: [],
    _permissionSeq: 0,
    _panel: { webview: { postMessage: (m) => posted.push(m) } },
    posted,
  }
}

/** 写工具桩（无 fs 落地——executed 记录执行事实）。 */
function writeToolSink(executed) {
  return {
    name: "write",
    touchedPaths: (a) => [a.path],
    execute: async (a) => { executed.push(a.path); return `Wrote ${a.path}` },
  }
}

/** 父级写驱动（depth 0 · 单写工具——不进批合并）：gate 构建在前，flip 在同轮之后。 */
function parentWrite(panel, flip) {
  const executed = []
  const gate = permissionGate(panel) // 构建期零读（ED-2 后恒返回回调）
  if (flip !== undefined) panel._autoApprove = flip // 同轮翻转（构建后、执行前）
  const agent = { cwd: _tmp, config: {}, _touchedFiles: [], history: [] }
  const history = []
  const run = executeToolBatches(agent, {
    response: { toolCalls: [{ id: "t0", name: "write", arguments: JSON.stringify({ path: "p.txt", content: "x" }) }] },
    history, fullHistory: [],
    toolByName: new Map([["write", writeToolSink(executed)]]),
    getAuto: () => panel._autoApprove,
    callbacks: { onPermissionRequired: gate },
    cwd: _tmp, recentSigs: [], depth: 0, signal: null,
  })
  return { run, executed, panel }
}

/** child 写驱动（depth 1 · 真 child 通道）：自身无 AUTO——判定 = 父门询问时 live 读。 */
function childWrite(panel) {
  const executed = []
  const approvals = []
  const childPerm = makeChildPermission({
    ctx: { callbacks: { onPermissionRequired: permissionGate(panel), onSubagentApproval: (i) => approvals.push(i) } },
    id: 5, role: "coder", model: null, signal: null,
  })
  const agent = { cwd: _tmp, config: {}, _touchedFiles: [], history: [] }
  const history = []
  const run = executeToolBatches(agent, {
    response: { toolCalls: [{ id: "t1", name: "write", arguments: JSON.stringify({ path: "c.txt", content: "x" }) }] },
    history, fullHistory: [],
    toolByName: new Map([["write", writeToolSink(executed)]]),
    getAuto: () => false,
    callbacks: { onPermissionRequired: childPerm },
    cwd: _tmp, recentSigs: [], depth: 1, signal: null,
  })
  return { run, executed, approvals, panel }
}

const reqs = (panel) => panel.posted.filter((m) => m.type === "permissionRequest")

// ─── 判据①：构建期开、同轮关 ⇒ 出卡 + 工具搁置（修复前 gate = undefined ⇒ 静默直通）───

test("判据① 开→关（同轮）：构建期 AUTO 开、同轮内关 ⇒ 父级写工具出卡 ≥1、工具搁置待批", async () => {
  const panel = stubPanel(true)
  const d = parentWrite(panel, false) // 构建期 on → 同轮 flip off
  await until(() => reqs(panel).length >= 1)
  assert.equal(reqs(panel).length, 1, "父级写工具出卡（修复前零卡——gate 构建期早退缺席）")
  assert.deepEqual(d.executed, [], "判定前工具搁置（零执行）")
  const entry = panel._permissionQueue[0]
  entry.resolve(true)
  await d.run
  assert.deepEqual(d.executed, ["p.txt"], "approve 后执行")
})

// ─── 判据②：构建期关、同轮开 ⇒ 零询问直通 ─────────────────────────────

test("判据② 关→开（同轮）：构建期 AUTO 关、同轮内开 ⇒ 父级写工具零卡直通（live 读）", async () => {
  const panel = stubPanel(false)
  const d = parentWrite(panel, true) // 构建期 off → 同轮 flip on
  await d.run
  assert.equal(reqs(panel).length, 0, "零卡（当轮直通——不再按构建期快照出卡）")
  assert.deepEqual(d.executed, ["p.txt"], "工具直通执行")
})

// ─── 判据③：父级与子代同判据（同一 live 值 · 开/关两态）────────────────

test("判据③ 同判据（父级与子代）：同一翻转下两侧同读 panel._autoApprove——开态双零卡 / 关态双出卡", async () => {
  const panel = stubPanel(true)
  // 开态：父级（getAuto live）+ 子代（父门 live）双零卡直通
  const pOn = parentWrite(panel, true)
  const cOn = childWrite(panel)
  await Promise.all([pOn.run, cOn.run])
  assert.equal(reqs(panel).length, 0, "开态：父级 + 子代双零卡（同判据 on）")
  assert.deepEqual(pOn.executed, ["p.txt"], "开态父级执行")
  assert.deepEqual(cOn.executed, ["c.txt"], "开态子代执行")

  // 关态：同轮一次翻转 off ⇒ 父级 + 子代双出卡（同判据 off）
  const before = panel.posted.length
  const pOff = parentWrite(panel, false)
  const cOff = childWrite(panel)
  await until(() => panel._permissionQueue.length === 2)
  const cards = reqs(panel).slice(before)
  assert.equal(cards.length, 2, "关态：父级 + 子代双出卡（同判据 off）")
  assert.deepEqual(cards.map((m) => m.owner), [null, "coder#5"], "父卡 owner null / 子卡归属 coder#5")
  for (const e of [...panel._permissionQueue]) e.resolve(true)
  await Promise.all([pOff.run, cOff.run])
  assert.deepEqual(pOff.executed, ["p.txt"], "关态父级批准后执行")
  assert.deepEqual(cOff.executed, ["c.txt"], "关态子代批准后执行")
})
