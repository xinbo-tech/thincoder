/**
 * queue-visible-vsc.test.mjs — queue-visible 批（2026-09-24 · 台账 #249）机器验收 · VSC 半（webview 面）。
 * 设计权威：`docs/vsc/design/WEBVIEW-INPUT.md` §1 C-B2-6 细则①⑦（待发送标记 / 消费成形 / 容量：
 * 判据源 = 快照）+ `docs/vsc/design/WEBVIEW-PROTOCOL.md` §3.2 行 17（快照字段）· §6.3（键
 * `queued.pending` / `input.slotFull` 逐字）；批档 `docs/batches/2026-09-24-busy-queue-visible.md`
 * §2 用例表（T-V16-11…14 住本档；T-V16-15/16 = 端壳面 ⇒ `test/queue-visible-shell.test.mjs`——
 * happy-dom 的全局 fetch 劫持与 mock-llm 本地链路不可同进程，用例号与断言面零变）。
 * 手法：① webview-env（happy-dom + capturedPosts）驱真 `send()` + 真 `chat.js` 消息 case；
 * ② host 直驱 `pushBusyQueued`（受理面快照 / 字段注册面）；③ CLI 同族对拍（跨仓 import——先例
 * `tool-summary-parity.test.mjs`）。零真实网络出站。
 * 协议门两档（`protocol-coverage{,-reverse}`）与既有 `busy-injection-vsc` 族零回归 = 全量
 * `npm test` 面（本档只锁快照字段 ⊆ 注册集）。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { setupWebview, installFullIndexFixture } from "./helpers/webview-env.mjs"
import { pushBusyQueued } from "../src/extension/panel-messages.mjs"
import * as vscQueued from "../src/extension/queued-merge.mjs"
import * as cliQueued from "../../thincoder-cli/src/tui/queued-merge.mjs"

let cleanupEnv
let capturedPosts
let W = null

before(async () => {
  const env = setupWebview()
  cleanupEnv = env.cleanup
  capturedPosts = env.capturedPosts
  installFullIndexFixture()
  const state = await import("../webview/state.js")
  await import("../webview/chat.js") // 真消息分发（`busyQueued` case → queued-mark.js）
  W = {
    S: state.S,
    ctx: state.ctx,
    t: (await import("../webview/i18n.js")).t,
    send: (await import("../webview/send.js")).send,
    toast: await import("../webview/toast.js"),
  }
})

after(() => {
  try { clearTimeout(W?.toast?.showToast?._t) } catch { /* no toast yet */ }
  try { window.dispatchEvent(new window.MessageEvent("message", { data: { type: "providerStatus", status: {}, keyOk: true } })) } catch { /* teardown edge */ }
  try { window.dispatchEvent(new window.Event("unload")) } catch { /* teardown edge */ }
  cleanupEnv()
})

const bubbles = () => [...document.querySelectorAll(".message.user")]
const marked = () => [...document.querySelectorAll(".message.user.pending")]
const pushSnapshot = (m) => window.dispatchEvent(new window.MessageEvent("message", { data: { type: "busyQueued", ...m } }))

/** 逐测冷启复位（DOM + 队列镜像——同文件串行）。 */
function resetWebview(value = "") {
  const { S, ctx } = W
  S._turnState = "idle"
  S._suspended = false
  S._workspaceRequired = false
  S._busyQueuedCount = 0
  S._busyQueuedPending = false
  S._phase = null
  ctx.messagesEl.replaceChildren()
  ctx._nextIdx = 0
  ctx.inputEl.value = value
  ctx._pastedImages.length = 0
  const toastEl = document.getElementById("paste-toast")
  if (toastEl) { toastEl.classList.remove("visible"); toastEl.textContent = "" }
}

test("T-V16-11 正常（webview）：`running` ⇒ send() ×2 出泡即标记（类 `pending` + 标签 = `⏳ <queued.pending>` 逐字）∧ 镜像 `_busyQueuedCount = 2`", () => {
  resetWebview()
  const { S, ctx, send, t } = W
  S._turnState = "running"
  const mark = capturedPosts.length
  ctx.inputEl.value = "q1"
  send()
  ctx.inputEl.value = "q2"
  send()
  const bs = marked()
  assert.equal(bs.length, 2, "两条气泡均带 `pending` 标记（本地提交路径出泡即标记）")
  assert.deepEqual(bs.map((el) => el.dataset.raw), ["q1", "q2"], "标记气泡 = 两条排队项（`data-raw` 锚定）")
  assert.equal(bs[0].querySelector(".msg-label").textContent, `⏳ ${t("queued.pending")}`, "标签行逐字 = `⏳ ` + `queued.pending` 值")
  assert.equal(bs[0].querySelector(".bubble").textContent, "q1", "原文照常显示")
  assert.deepEqual([S._busyQueuedCount, S._busyQueuedPending], [2, true], "镜像：受理即本地先行自增（host 推送权威收敛）")
  assert.equal(capturedPosts.slice(mark).filter((m) => m.type === "queuedUserMessage").length, 2, "两条上行（受理面）")
})

test("T-V16-12 快照四面：① items 逐条标记（幂等——无重复建泡）② 满队 count >= 8（不出泡 / 不清框 / toast）③ merged 多条批（移除已标记 + 追加合并气泡）④ merged 单条批（清标保留）", () => {
  resetWebview()
  const { S, ctx, send, t } = W
  S._turnState = "running"
  // ① items 逐条标记（无回显入口 ⇒ 流尾新建；重推幂等）
  pushSnapshot({ pending: true, count: 2, items: ["a", "b"] })
  assert.deepEqual(marked().map((el) => el.dataset.raw), ["a", "b"], "逐条新建 + 标记（顺序 = items）")
  assert.deepEqual(bubbles().map((el) => el.dataset.raw), ["a", "b"], "无重复建泡（旧文气泡不存在 ⇒ 新建恰 N 条）")
  pushSnapshot({ pending: true, count: 2, items: ["a", "b"] })
  assert.equal(bubbles().length, 2, "幂等重推零重复")
  assert.deepEqual([S._busyQueuedCount, S._busyQueuedPending], [2, true], "镜像随快照收敛")
  // ② 满队（第 9 条）：不出泡 / 不清框 / toast（判据源 = 快照 count）
  pushSnapshot({ pending: true, count: 8, items: ["a", "b"] })
  const n0 = bubbles().length
  const mark = capturedPosts.length
  ctx.inputEl.value = "ninth"
  send()
  assert.equal(bubbles().length, n0, "不出泡（满队拒）")
  assert.equal(ctx.inputEl.value, "ninth", "文本保留（不清框）")
  assert.equal(capturedPosts.slice(mark).filter((m) => m.type === "queuedUserMessage").length, 0, "零上行（零受理）")
  const toastEl = document.getElementById("paste-toast")
  assert.ok(toastEl?.classList.contains("visible"), "toast 即时可见（不静默拒）")
  assert.equal(toastEl.textContent, t("input.slotFull"), "toast 文案 = `input.slotFull`（值改条数阈 8）")
  clearTimeout(W.toast.showToast._t)
  // ③ merged 多条批：已标记气泡移除 + 追加一条合并气泡（文本 = merged）
  const mergedAB = vscQueued.formatMergedMessages(["a", "b"])
  pushSnapshot({ pending: false, count: 0, items: [], merged: mergedAB })
  const raws = bubbles().map((el) => el.dataset.raw)
  assert.ok(!raws.includes("a") && !raws.includes("b"), "已标记气泡移除（就地合泡）")
  assert.ok(raws.includes(mergedAB), "追加合并气泡（文本 = merged）")
  assert.equal(marked().length, 0, "合并气泡不带标记（已送达面）")
  assert.deepEqual([S._busyQueuedCount, S._busyQueuedPending], [0, false], "镜像复位（消费即清）")
  // ④ merged 单条批：清标保留（气泡 = 回声面）
  resetWebview()
  S._turnState = "running"
  pushSnapshot({ pending: true, count: 1, items: ["solo"] })
  assert.deepEqual(marked().map((el) => el.dataset.raw), ["solo"], "单条批前置：标记在位")
  pushSnapshot({ pending: false, count: 0, items: [], merged: "solo" })
  assert.deepEqual(bubbles().map((el) => el.dataset.raw), ["solo"], "气泡不删（回声面）")
  assert.equal(marked().length, 0, "类 `pending` 去除（清标）")
  assert.equal(bubbles()[0].querySelector(".msg-label").textContent, `❯ ${t("msg.user")}:`, "标签行回常态（无 ts 不显示）")
})

test("T-V16-13 边界：部分消费（剩余项保持标记——无悬空）∧ Reload 冷启（items 顺序重建 N 气泡）∧ 引用失效守卫（清屏后重推自愈）", () => {
  resetWebview()
  const { ctx } = W
  pushSnapshot({ pending: true, count: 3, items: ["a", "b", "c"] })
  assert.equal(marked().length, 3, "3 条排队项逐条标记")
  const mergedAB = vscQueued.formatMergedMessages(["a", "b"])
  pushSnapshot({ pending: true, count: 1, items: ["c"], merged: mergedAB }) // 部分消费：a,b 合批、c 留队
  assert.deepEqual(marked().map((el) => el.dataset.raw), ["c"], "剩余项保持标记（无悬空——已消费项清出）")
  assert.ok(bubbles().map((el) => el.dataset.raw).includes(mergedAB), "本批合并气泡在场")
  // Reload 冷启（clearMessages 语义：DOM 清空）+ 握手重推 ⇒ 按 items 重建
  ctx.messagesEl.replaceChildren()
  ctx._nextIdx = 0
  pushSnapshot({ pending: true, count: 1, items: ["c"] })
  assert.deepEqual(marked().map((el) => el.dataset.raw), ["c"], "按 items 重建 N 气泡（冷启重放准）")
  // 引用失效守卫：气泡被移除 / 清屏 ⇒ 弃引用 + 幂等重推自愈（零崩）
  ctx.messagesEl.replaceChildren()
  pushSnapshot({ pending: true, count: 2, items: ["x", "y"] })
  assert.deepEqual(marked().map((el) => el.dataset.raw), ["x", "y"], "已移除引用弃用 + 重建（零崩）")
})

test("T-V16-14 正常/回归：`queued-merge.mjs` 与 CLI 同族对拍——常量值 / 文案逐字 / 计划输出同名同值（含 webview 副本值）", async () => {
  const mark = await import("../webview/queued-mark.js")
  for (const k of ["MAX_MERGE_ITEMS", "MAX_MERGE_CHARS", "QUEUED_MAX_ITEMS"]) {
    assert.equal(vscQueued[k], cliQueued[k], `常量同名同值：${k}`)
  }
  assert.equal(mark.QUEUED_MAX_ITEMS, cliQueued.QUEUED_MAX_ITEMS, "webview 副本同值（浏览器面双写登记）")
  assert.equal(vscQueued.formatMergedMessages(["a", "b"]), cliQueued.formatMergedMessages(["a", "b"]), "形态文案逐字同")
  const cases = [["a"], ["a", "b"], ["/help", "a", "b"], Array.from({ length: 9 }, (_, i) => `m${i}`), ["x".repeat(2001)], ["y".repeat(1500), "z".repeat(1500)]]
  for (const items of cases) {
    assert.deepEqual(vscQueued.planQueuedInput(items), cliQueued.planQueuedInput(items), `计划输出双端同值（${items.length} 项）`)
  }
})

test("T-V16-15b 受理面快照（host 直驱）：`pushBusyQueued` 携两载体合计 + 队尾项原文（`text`）+ 本批 `merged`", () => {
  const posted = []
  const mk = (over) => ({ _busyQueued: [], _susp: null, _panel: { webview: { postMessage: (m) => { posted.push(m); return Promise.resolve(true) } } }, ...over })
  pushBusyQueued(mk({ _busyQueued: [{ text: "a" }, { text: "b" }], _susp: { pendingInput: [{ text: "c" }] } }))
  assert.deepEqual(posted[0], { type: "busyQueued", pending: true, count: 3, items: ["a", "b", "c"], text: "c" }, "受理面快照（两载体合计 + 队尾项原文）")
  pushBusyQueued(mk({ _busyQueued: [{ text: "a" }] }), "merged-text")
  assert.equal(posted[1].merged, "merged-text", "消费推送携本批 `merged`")
  pushBusyQueued(mk({}))
  assert.deepEqual(posted[2], { type: "busyQueued", pending: false, count: 0, items: [] }, "空队列 ⇒ count:0（零 `text` / 零 `merged`）")
})
