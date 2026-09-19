/**
 * webview-permission-batch-release.test.mjs — F-W13（批权限卡必可释放）机器验收。
 *
 * 设计权威：`docs/vsc/design/WEBVIEW.md` §4.1（权限卡族释放形态 · 卡消失 · 零静默无效）+
 * `docs/vsc/design/WEBVIEW-PROTOCOL.md` §4.6（族键 id 纪律 · 单一释放通道 · 孤儿回写 ·
 * 释放即刷新）· §4.4（`waiting` 三队列 + 释放 ⇒ 必刷）；批次档
 * `docs/batches/2026-09-18-vsc-session-wiring.md` §2.3（W13-1…W13-7）与 §2.7 ②。
 *
 * 手法：host 半 = 真 `permission-gate.mjs` / `panel-messages.mjs` + 桩面板
 * （`Object.create(ChatPanel.prototype)`——`_refreshStatus` / `turnBusy` 走真实现，
 * `_setStatus` 记录态；`settings-open-snapshots.test.mjs` 模式）；webview 半 = 真 chat.js
 * 模块图（`digest-visibility.test.mjs` 模式）——`batchPermissionRequest` / `permissionWithdrawn`
 * 的唯一消费位与真 `permission.js` 渲染。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { setupWebview, installFullIndexFixture } from "./helpers/webview-env.mjs"
import { batchPermissionGate } from "../src/extension/permission-gate.mjs"
import { handlePanelMessage } from "../src/extension/panel-messages.mjs"
import { ChatPanel } from "../src/extension/chat-panel.mjs"

let cleanupEnv
let capturedPosts

before(async () => {
  const env = setupWebview()
  cleanupEnv = env.cleanup
  capturedPosts = env.capturedPosts
  installFullIndexFixture() // 真 chat.js 顶层 init 读全量 index.html id
  await import("../webview/chat.js")
})

after(() => {
  try { window.dispatchEvent(new window.Event("unload")) } catch { /* happy-dom teardown edge */ }
  cleanupEnv()
})

/** 宿主 → webview 帧。 */
const send = (data) => window.dispatchEvent(new window.MessageEvent("message", { data }))

// ─── host 半夹具（真原型方法：_refreshStatus / turnBusy；_setStatus 观测态）────────

function stubPanel(overrides = {}) {
  const posted = []
  const states = []
  const ac = new AbortController()
  const p = Object.create(ChatPanel.prototype)
  Object.assign(p, {
    _turnState: "idle",
    _permissionQueue: [],
    _questionQueue: [],
    _batchPermissionQueue: [],
    _permissionSeq: 0,
    _autoApprove: false,
    _abortController: ac,
    _panel: { webview: { postMessage: (m) => { posted.push(m); return Promise.resolve(true) } } },
    _setStatus: (s) => states.push(s),
    posted, states, ac,
    ...overrides,
  })
  return p
}

const msgs = (p, type) => p.posted.filter((m) => m.type === type)

// ─── W13-1 / W13-4 / W13-5 / W13-6 / W13-7（host 半）─────────────────────────

test("W13-1 停驻批门 Stop 释放（正常）：abort ⇒ 队空 + permissionWithdrawn{promptId} + resolve deny", async () => {
  const p = stubPanel()
  const ask = batchPermissionGate(p)({ tools: [{ name: "write" }, { name: "edit" }], count: 2 })
  const card = msgs(p, "batchPermissionRequest")[0]
  assert.ok(card, "批卡已发")
  assert.equal(typeof card.promptId, "number", "批卡携 promptId（并入逐项卡族——D-W15）")
  assert.equal(p._batchPermissionQueue.length, 1, "批门停驻（队列一条）")

  p.ac.abort() // 轮级 Stop / Ctrl+I（panel._abortController abort）
  assert.equal(await ask, "deny", "释放值 = deny（与逐项门同语义）")
  assert.equal(p._batchPermissionQueue.length, 0, "队空")
  assert.deepEqual(msgs(p, "permissionWithdrawn"), [{ type: "permissionWithdrawn", promptId: card.promptId }],
    "发 permissionWithdrawn{promptId = 卡 id}（卡由同一选择器移除）")
})

test("W13-4 空队响应零静默无效（错误）：孤儿响应 ⇒ 零 throw + 发 permissionWithdrawn{promptId} + 队仍空", async () => {
  for (const queue of [undefined, []]) {
    const p = stubPanel({ _batchPermissionQueue: queue })
    p.posted.length = 0
    await handlePanelMessage(p, { type: "batchPermissionResponse", choice: "deny", promptId: 99 })
    assert.deepEqual(msgs(p, "permissionWithdrawn"), [{ type: "permissionWithdrawn", promptId: 99 }],
      `零命中 ⇒ 可见处置（queue=${JSON.stringify(queue)}）`)
    assert.equal(p._batchPermissionQueue?.length ?? 0, 0, "队仍空（不 resolve 任何条目、不新造条目）")
    assert.deepEqual(p.states, [], "孤儿处置不改队列 ⇒ 零刷新（幂等）")
  }
})

test("W13-5 id 精确匹配（边界）：两条目（id 1/2）响应 id=2 ⇒ 只 id=2 出队；id=1 仍在", async () => {
  const p = stubPanel()
  let r1 = null
  const a1 = batchPermissionGate(p)({ tools: [{ name: "write" }], count: 1 })
  a1.then((v) => { r1 = v })
  const a2 = batchPermissionGate(p)({ tools: [{ name: "edit" }], count: 1 })
  const ids = msgs(p, "batchPermissionRequest").map((m) => m.promptId)
  assert.equal(ids.length, 2, "两条目各有卡 id")
  assert.notEqual(ids[0], ids[1], "同一单调计数器 ⇒ 跨族唯一")

  await handlePanelMessage(p, { type: "batchPermissionResponse", choice: "deny", promptId: ids[1] })
  assert.equal(await a2, "deny", "id=2 条目出队并 resolve")
  assert.equal(r1, null, "id=1 未被 resolve（非 shift 队头）")
  assert.equal(p._batchPermissionQueue.length, 1, "只出一条")
  assert.equal(p._batchPermissionQueue[0].id, ids[0], "id=1 仍在队")
  p.ac.abort() // 清尾（不留悬挂 promise）
  await a1
})

test("W13-6 旧 webview 兼容（边界·回归锚）：无 promptId 的响应回退队头（既有语义不变）", async () => {
  const p = stubPanel()
  let r1 = null
  const a1 = batchPermissionGate(p)({ tools: [{ name: "write" }], count: 1 })
  a1.then((v) => { r1 = v })
  const a2 = batchPermissionGate(p)({ tools: [{ name: "edit" }], count: 1 })

  await handlePanelMessage(p, { type: "batchPermissionResponse", choice: "oneByOne" })
  assert.equal(r1, "oneByOne", "回退队头（旧 webview 兼容路径）")
  assert.equal(p._batchPermissionQueue.length, 1, "只出队一条")
  p.ac.abort()
  assert.equal(await a2, "deny")
})

test("W13-7 释放 ⇒ 状态栏刷新（正常）：停驻期读 waiting；Stop 释放后不残留 waiting", async () => {
  const p = stubPanel()
  const ask = batchPermissionGate(p)({ tools: [{ name: "write" }], count: 1 })
  p.states.length = 0

  p._refreshStatus() // 停驻期任一次刷新（如 question 响应路径）
  assert.deepEqual(p.states, ["waiting"], "批卡停驻期 status = waiting（判据含批权限队列）")

  p.ac.abort()
  await ask
  assert.ok(["idle", "running"].includes(p.states.at(-1)),
    `释放后不残留 waiting（实读 ${p.states.at(-1)}）`)
})

// ─── W13-2 / W13-3（webview 半：真 chat.js 消费位 + 真 permission.js）──────────

test("W13-2 卡族 id + 移除（正常）：合并卡落 data-prompt-id；permissionWithdrawn 按同一选择器移除", () => {
  send({ type: "clearMessages" })
  send({ type: "batchPermissionRequest", tools: [{ name: "write" }, { name: "edit" }], count: 2, promptId: 7 })
  const card = document.querySelector("#messages .permission-prompt")
  assert.ok(card != null, "合并卡在 DOM（与逐项卡同族 = 同一选择器）") // 布尔断言：DOM 节点不入断言载荷
  assert.equal(card.dataset.promptId, "7", "族键 = data-prompt-id")

  send({ type: "permissionWithdrawn", promptId: 7 })
  assert.ok(document.querySelector("#messages .permission-prompt[data-prompt-id]") == null,
    "同一移除选择器命中并移除（逐项 / 合并零分支）")
})

test("W13-3 三按钮载荷（正常）：approve-all / one-by-one / deny 各携 {choice, promptId}", () => {
  const cases = [[".approve-all", "approveAll"], [".one-by-one", "oneByOne"], [".deny", "deny"]]
  for (const [sel, choice] of cases) {
    send({ type: "clearMessages" })
    capturedPosts.length = 0
    send({ type: "batchPermissionRequest", tools: [{ name: "write" }], count: 1, promptId: 42 })
    document.querySelector("#messages .permission-prompt " + sel).click()
    assert.deepEqual(capturedPosts.filter((m) => m.type === "batchPermissionResponse"),
      [{ type: "batchPermissionResponse", choice, promptId: 42 }], `${sel} 载荷 = {choice, promptId}`)
  }
})
