/**
 * pool-snapshot.test.mjs — QUEUED-VISIBILITY 测试（VSC extension 侧，2026-09-09）：
 * F-3 webviewReady 快照重推（postPoolSnapshot——panel-callbacks.mjs——queued/running
 * 池行以既有消息形状重放——载荷形状/位置计数/等待态派生/角色过滤/双池）+
 * F-2 cancelSubagent 路由确认（panel-messages.mjs——queued ⏹ 点击 = 引擎出队路径——
 * 纯 UI 暴露——引擎零改——was:"queued" 通知 + 墓碑 + 陈旧 ⏹ no-op）。
 * docs/design/QUEUED-VISIBILITY.md 用例表（F-3 边界行——空池/仅 running——F-2 错误行）。
 *
 * 手法：桩面板（posted 记录）+ 最小 history 载体（真数组 + _asyncSubagents/
 * _asyncAdvisors 池 Map expando——与 run 期 lines.history 同形）——确定性单元
 * （无 io/无 LLM——chat-panel.test.mjs 同款桩面）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { postPoolSnapshot } from "../src/extension/panel-callbacks.mjs"
import { handlePanelMessage } from "../src/extension/panel-messages.mjs"

/** 最小 live lines history（真数组 + 池 expando——与 agent.mjs 运行期 history 同形）。 */
function mkHistory(over = {}) {
  const history = []
  Object.assign(history, {
    _asyncSubagents: new Map(),
    _asyncAdvisors: new Map(),
    _asyncTombstones: new Map(),
    _pendingAsyncResults: [],
    ...over,
  })
  return history
}

/** 桩面板（posted 记录——postMessage 收载 + cancelSubagent 路由的 _liveLines 锚）。 */
function stubPanel(over = {}) {
  const posted = []
  const p = {
    _turnState: "idle",
    _susp: null,
    _liveLines: null,
    _panel: { webview: { postMessage: (m) => { posted.push(m); return Promise.resolve(true) } } },
    _refreshStatus() {},
    _setStatus() {},
    posted,
    ...over,
  }
  return p
}

/** 池条目最小形（spawn 后 entry 字段面——snapshot/cancel 读取的子集）。 */
function mkEntry(id, role, status, over = {}) {
  return {
    id, role, status, done: false, cancelled: false,
    startedAt: status === "running" ? Date.now() - 60000 : null,
    model: status === "running" ? "glm-5.3" : null,
    _files: [], _dependsOn: [],
    ...over,
  }
}

const lines = (history, cwd = "C:/ws") => ({ history, fullHistory: history, cwd })

// ─── F-3 快照重放（AC-3——QUEUED-VISIBILITY 设计 §2）───────────────────────

test("F-3 queued+running 快照重放：行形状/位置计数/等待态派生/角色过滤/双池——id 升序 = spawn 序", () => {
  const history = mkHistory()
  // 池插入序（真实运行序）——engine position = 池 Map 序 queued 过滤计数
  history._asyncSubagents.set(1, mkEntry(1, "eng-coder", "running")) // running 块（started 形重放）
  history._asyncSubagents.set(2, mkEntry(2, "explore", "queued"))   // slot 等位——pos 1
  history._asyncSubagents.set(3, mkEntry(3, "plan", "queued", { _files: ["C:/ws/a.mjs"] }))
  history._asyncSubagents.set(5, mkEntry(5, "escalate", "running")) // 非 family——重放外
  history._asyncSubagents.set(6, mkEntry(6, "coder", "queued"))     // pos 3
  history._asyncAdvisors.set(4, mkEntry(4, "advisor", "running"))   // 独立池——started 形重放
  // running 先行者占文件域 → #3 等待态 = wait（域冲突——describeBlockers 活派生）
  history._asyncSubagents.get(1)._files = ["C:/ws/a.mjs"]
  history._asyncSubagents.get(3)._dependsOn = [] // 依赖为空——纯文件域冲突
  const p = stubPanel()

  postPoolSnapshot(p, lines(history))

  const msgs = p.posted.filter((m) => m.type === "subagent")
  assert.deepEqual(msgs.map((m) => m.id), [1, 2, 3, 4, 6], "id 升序 = 双池共号源的 spawn/到达序（区序复刻——escalate 5 过滤）")
  // running 行 = started 事件形（块重建面——activity.js started 分支消费）
  assert.deepEqual(msgs[0], { type: "subagent", id: 1, role: "eng-coder", status: "started", startedAt: history._asyncSubagents.get(1).startedAt, model: "glm-5.3", pool: true }, "running 行形状 = started 事件（id/role/status/startedAt/model/pool）")
  assert.equal(msgs[3].role, "advisor", "advisor 池 running 行同样重放（family 面）")
  // queued 行 = refreshQueuedRows 载荷形状（id/role/status/position + 等待态）
  assert.deepEqual(msgs[1], { type: "subagent", id: 2, role: "explore", status: "queued", position: 1 }, "queued 行（slot）形状 = refreshQueuedRows 载荷（非新消息类型）")
  const row3 = msgs[2]
  assert.equal(row3.status, "queued")
  assert.equal(row3.position, 2, "position = 池 Map 序 queued 过滤计数（引擎同源）")
  assert.equal(row3.waiting, "waiting-deps", "等待态 kind → waiting 字段（wait/depc——refreshQueuedRows 同款）")
  assert.ok(row3.reason.includes("域冲突"), `reason = describeBlockers detail 活派生（got: ${row3.reason}）`)
  assert.equal(msgs[4].position, 3, "跨序计数连续（escalate running 不计）")
  assert.equal(msgs[4].status, "queued")
  assert.equal(msgs[4].waiting, undefined, "slot 等位不带 waiting 字段")
})

test("F-3 边界：空池 → 零快照消息（活动区空）；仅 running 池 → 只 started 行（queued 无）", () => {
  // 空池（未 run/池已空——reload 常见面）→ 无 subagent 消息（无等待头无 running 块）
  const p1 = stubPanel()
  postPoolSnapshot(p1, lines(mkHistory()))
  assert.equal(p1.posted.length, 0, "空池 reload → 无快照消息（用例表 F-3 边界——活动区空）")
  postPoolSnapshot(p1, null)
  assert.equal(p1.posted.length, 0, "lines 缺失（无活回合锚）→ 零消息无抛")

  // 仅 running 池 → 只 started 形重放（running 块重建——queued 行无）
  const history = mkHistory()
  history._asyncSubagents.set(7, mkEntry(7, "explore", "running"))
  const p2 = stubPanel()
  postPoolSnapshot(p2, lines(history))
  const msgs = p2.posted.filter((m) => m.type === "subagent")
  assert.equal(msgs.length, 1, "仅 running 池 → 恰一行")
  assert.equal(msgs[0].status, "started", "running 行重放（用例表 F-3 边界——running 块重建——queued 无）")
})

// ─── F-2 路由确认（点击 = 出队——引擎路径既有——纯 UI 暴露面）───────────────

test("F-2 cancelSubagent 路由（queued 目标）：引擎出队 + was:\"queued\" 通知 + 墓碑——陈旧 ⏹ no-op（用例表 F-2 错误行）", async () => {
  const notified = []
  const history = mkHistory()
  const e9 = mkEntry(9, "eng-coder", "queued")
  e9._onCancelled = (wasQueued) => notified.push({ id: 9, role: "eng-coder", status: "cancelled", ...(wasQueued ? { was: "queued" } : {}) })
  history._asyncSubagents.set(9, e9)
  const p = stubPanel({ _liveLines: lines(history) })

  await handlePanelMessage(p, { type: "cancelSubagent", id: "9", role: "eng-coder" })

  assert.equal(history._asyncSubagents.has(9), false, "queued 目标出队（map 移除——引擎 cancelSubagent）")
  assert.deepEqual(history._asyncTombstones.get(9), { status: "cancelled", role: "eng-coder" }, "出队即终态 → cancelled 墓碑（依赖者查得）")
  assert.equal(notified.length, 1, "was:\"queued\" 通知发出（生产 = entry._onCancelled → onSubagent → webview 移除等待头）")
  assert.equal(notified[0].was, "queued", "webview 消费形状（activity.js cancelled+was 分支——块移除）")

  // 陈旧 ⏹（块已出队残留点击——用例表 F-2 错误行）→ 路由 no-op（未知 id——无虚构状态）
  await handlePanelMessage(p, { type: "cancelSubagent", id: "9", role: "eng-coder" })
  assert.equal(notified.length, 1, "陈旧点击零通知（引擎 error 路径——块已移除无副作用）")
  assert.equal(history._asyncTombstones.size, 1, "无新墓碑（幂等）")
})
