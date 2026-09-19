/**
 * permission-gate-seam.test.mjs — P2 机制层端差批（`docs/batches/2026-09-20-mechanism-parity-batch.md`
 * §2.20 VSC 半）机器验收：`permissionGate` 改经核 `askPermission`（`@thincoder/core/permission.mjs`）
 * 的 `io.ask` 缝——本端只供展示面（面板卡片 / 队列 / 释放三路）。
 *
 * T-PT6–T-PT8：接缝（入队 + 卡片载荷 + 作答 resolve）/ AUTO 短路 / 中止释放（轮级 + child 定向）。
 * 端到端应答路（webview 消息 → `handlePanelMessage` → 同一 `releasePermission`）由既有已登记档
 * 覆盖（`child-permission.test.mjs` · `webview-permission-batch-release.test.mjs`——本批零改）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { permissionGate, releasePermission } from "../src/extension/permission-gate.mjs"

/** panel 假体（`test/child-permission.test.mjs` stubPanel 同款字段面——零 webview 依赖）。 */
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
    posted,
    ...overrides,
  }
  return p
}

const cards = (panel) => panel.posted.filter((m) => m.type === "permissionRequest")
const withdrawn = (panel) => panel.posted.filter((m) => m.type === "permissionWithdrawn")

// ─── T-PT6：接缝（卡片载荷逐字保 + 作答 resolve）──────────────────────────────

test("T-PT6 正常：permissionGate 入队 + permissionRequest 载荷（含 promptId）· 作答 ⇒ resolve 值", async () => {
  const panel = stubPanel()
  const gate = permissionGate(panel)
  const args = { path: "a.txt", content: "x" }
  const diff = { old: "", new: "x", path: "a.txt" }
  const pending = gate("write", args, diff, { owner: { label: "coder#7" }, signal: null })

  assert.equal(panel._permissionQueue.length, 1, "入队恰一条（闸语义 = 核单源，展示面在本端）")
  const card = cards(panel)[0]
  assert.ok(card, "permissionRequest 已投递")
  assert.equal(card.tool, "write")
  assert.deepEqual(JSON.parse(card.args), args, "载荷 args = 原对象 JSON（逐字保）")
  assert.deepEqual(card.diff, diff, "载荷 diff = 端侧预览（逐字保）")
  assert.equal(card.owner, "coder#7", "child 卡归属透传")
  assert.equal(card.promptId, panel._permissionQueue[0].id, "promptId = 队列条目 id（应答按 id 精确路由）")
  assert.equal(panel._permissionQueue[0].resolve.constructor, Function)

  releasePermission(panel, panel._permissionQueue[0], true)
  assert.equal(await pending, true, "作答 approve ⇒ resolve(true)")
  assert.equal(panel._permissionQueue.length, 0, "出队")
  assert.equal(withdrawn(panel).length, 1, "释放 ⇒ permissionWithdrawn（卡移除信号）")

  // 反例面：作答 deny ⇒ resolve(false)
  const deny = gate("bash", { command: "rm -rf /" }, null, undefined)
  releasePermission(panel, panel._permissionQueue[0], false)
  assert.equal(await deny, false, "作答 deny ⇒ resolve(false)")
})

// ─── T-PT7：AUTO 短路 ──────────────────────────────────────────────────────

test("T-PT7 边界：面板 _autoApprove=true ⇒ resolve(true) ∧ 零入队 ∧ 零 postMessage", async () => {
  const panel = stubPanel({ _autoApprove: true })
  const gate = permissionGate(panel)

  const r = await gate("write", { path: "a.txt", content: "x" }, null, undefined)

  assert.equal(r, true, "AUTO 直通")
  assert.equal(panel._permissionQueue.length, 0, "零入队")
  assert.deepEqual(panel.posted, [], "零 postMessage")
})

// ─── T-PT8：中止释放（三路语义零改）──────────────────────────────────────────

test("T-PT8 边界：轮级 abort ⇒ release(false)；child 定向 signal abort 同判据", async () => {
  // ① 轮级 Stop（panel._abortController）
  const panel = stubPanel({ _abortController: new AbortController() })
  const gate = permissionGate(panel)
  const pending = gate("write", { path: "b.txt" }, null, undefined)
  assert.equal(panel._permissionQueue.length, 1, "在队（等待作答）")

  panel._abortController.abort()

  assert.equal(await pending, false, "轮级 Stop ⇒ deny 释放（不挂死）")
  assert.equal(panel._permissionQueue.length, 0, "出队")
  assert.equal(withdrawn(panel).length, 1, "释放 ⇒ permissionWithdrawn")

  // ② child 定向取消（opts.signal = 条目级 controller）
  const panel2 = stubPanel()
  const gate2 = permissionGate(panel2)
  const ac = new AbortController()
  const pending2 = gate2("write", { path: "c.txt" }, null, { owner: { label: "coder#9" }, signal: ac.signal })

  ac.abort()

  assert.equal(await pending2, false, "child 定向取消 ⇒ deny 释放")
  assert.equal(panel2._permissionQueue.length, 0, "出队（同释放通道）")
})
