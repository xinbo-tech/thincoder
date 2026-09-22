/**
 * activity-flow.test.mjs — 活动区语义全族（2026-09-11 活动区回归 → **2026-09-12 活动区收口批
 * 改写**——`WEBVIEW.md` §14 现行机制：区驻留 live + awaitingDigest；终态归档入流）。
 * 覆盖：T-R1 区出生/T-R2 内容/T-R3 终态两路（§14 改写）/T-R4 queued 三分支/T-R7 区显隐/
 * T-R9 150 窗含归档块（§14 C-…T-CL9）/T-R10 区自滚/T-R11 清屏恢复/T-R12 reset 只清区（C-7）/
 * T-R13 ⏹ 委托/T-R14 迟来丢弃/T-R15 error·answered（归档）/多并行/重复 started。
 * 手法：installChatFixture（含 `#subagent-activity`）+ 动态 import 真模块（T-R13 追加补 id 引导
 * 真 chat.js 图——§12.7 注）。归档/awaiting/接管吞守卫/块头字段面 = `activity-closure.test.mjs`
 * 主力（不重复——TEST-LIFECYCLE 扫① 纪律）；原 T-R8 区上限（C-6 退役）、T-R16 兜底折叠
 * （§14 C-8 区全体归档）随 §14 撤销。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { setupWebview, installChatFixture } from "./helpers/webview-env.mjs"

let cleanupEnv
let capturedPosts // T-R13 断言面（setupWebview 返回）
let appendChunk // ui.appendAdvisorChunk（loadWebview 赋值——feedText 用）

before(() => {
  const env = setupWebview()
  cleanupEnv = env.cleanup
  capturedPosts = env.capturedPosts
  installChatFixture()
})

after(() => {
  try { window.dispatchEvent(new window.Event("unload")) } catch { /* happy-dom teardown edge */ }
  cleanupEnv()
})

/** 动态 import 真模块（模块缓存——每文件一次；必须在 setupWebview 之后）。 */
async function loadWebview() {
  const state = await import("../webview/state.js")
  const ui = await import("../webview/ui.js")
  const activity = await import("../webview/activity.js")
  appendChunk = ui.appendAdvisorChunk
  return {
    S: state.S, ctx: state.ctx, trimOldMessages: ui.trimOldMessages,
    maybeScrollActivity: ui.maybeScrollActivity, initScrollFollow: ui.initScrollFollow, ...activity,
  }
}

/** 逐测冷启复位（node --test 同文件串行——模块缓存共享同一 S/ctx——每测独立起点）。 */
function fresh({ S, ctx }) {
  ctx.messagesEl.replaceChildren()
  ctx.activityEl.replaceChildren()
  S._subBlocks.clear()
  S._digestBoundary = null
  S._subDescShown = true // A13 说明行一次性标志（本档头词断言不受扰——该面另有专档）
  ctx._pinBottom = undefined
  ctx._pinActivity = undefined
}

/** 造一条会话消息（.message——消息窗裁剪/兄弟序用）。 */
function addMessage(ctx, tag) {
  const el = document.createElement("div")
  el.className = "message"
  if (tag != null) el.dataset.tag = tag
  ctx.messagesEl.appendChild(el)
  return el
}

/** 往块内容灌行（appendAdvisorChunk——streaming.subagentChunk 同函数）。 */
function feedText(block, text) {
  appendChunk(block, "text", text)
}

/** 活动区内 .sub-block 直接子元素（多块/重复断言用）。 */
function subBlocks(ctx) {
  return [...ctx.activityEl.children].filter((el) => el.classList.contains("sub-block"))
}
/** #messages 内 .sub-block（归档落流面——§14 C-3）。 */
function streamBlocks(ctx) {
  return [...ctx.messagesEl.children].filter((el) => el.classList.contains("sub-block"))
}
/** 直接子元素序号（区间内位置断言用）。 */
function idxOf(el) {
  return [...el.parentNode.children].indexOf(el)
}

// ─── 用例表逐行（§12.7 → §14 改写）────────────────────────────

test("T-R1 区出生（AC-CL1）：pool started → 块 append 活动区区尾 + #messages 零块", async () => {
  const { S, ctx, applySubagentStatus } = await loadWebview()
  fresh({ S, ctx })
  addMessage(ctx, "m1")
  applySubagentStatus({ type: "subagent", status: "started", role: "explore", id: 7, pool: true, model: "glm-5.3" })
  const block = S._subBlocks.get("sub:explore#7")
  assert.ok(block, "started 建块")
  assert.equal(block.parentNode, ctx.activityEl, "块 append 活动区（区内出生）")
  assert.equal(block, ctx.activityEl.lastElementChild, "出生位 = 活动区区尾")
  assert.equal(idxOf(block), 0, "区内首块（区尾 append——非嵌入）")
  assert.equal(streamBlocks(ctx).length, 0, "#messages 内零 .sub-block（live 不落流）")
  assert.equal(subBlocks(ctx).length, 1, "区内单块")
  assert.ok(block.classList.contains("sub-live") && !block.classList.contains("sub-frozen"), "live 态")
  assert.equal(block._subMeta.label, "explore#7", "label = 频道去 sub: 前缀")
  const hdr = block.querySelector(".sub-hdr").textContent
  assert.ok(hdr.includes("▶") && hdr.includes("explore#7") && !hdr.includes("sub:"), "头词 [▶ explore#7…] 无 sub: 前缀")
  assert.equal(S._subBlocks.size, 1)
})

test("T-R2 内容入块：chunk appendAdvisorChunk 进块（tool/text 行——区内）", async () => {
  const { S, ctx, ensureBlock } = await loadWebview()
  fresh({ S, ctx })
  const block = ensureBlock("sub:eng-coder#1")
  appendChunk(block, "tool", "read x.mjs")
  feedText(block, "report line one\nreport line two")
  assert.equal(block.parentNode, ctx.activityEl, "块在活动区")
  const content = block.querySelector(".advisor-content")
  assert.ok(content.textContent.includes("read x.mjs"), "tool 行在内容区")
  assert.ok(content.textContent.includes("report line two"), "text 行在内容区（尾部完整）")
})

test("T-R3 终态两路（§14 改写·AC-CL1/AC-CL3）：done → 即时归档尾追；settled → 折叠驻留 + 态词（回收才归档）", async () => {
  const { S, ctx, applySubagentStatus } = await loadWebview()
  fresh({ S, ctx })
  addMessage(ctx, "m1")
  applySubagentStatus({ type: "subagent", status: "started", role: "explore", id: 7, pool: true, model: "glm-5.3" })
  const block = S._subBlocks.get("sub:explore#7")
  assert.ok(block.querySelector(".sub-stop-btn"), "running+pool → ⏹ 在位")
  applySubagentStatus({ type: "subagent", status: "done", role: "explore", id: 7, turn: 4 })
  assert.equal(block.parentNode, ctx.messagesEl, "done → 折叠 + 即时归档（C-3 ②）")
  assert.equal(block, ctx.messagesEl.lastElementChild, "尾追（无边界）")
  assert.equal(streamBlocks(ctx).length, 1, "#messages 一块（归档落流）")
  assert.ok(block.classList.contains("sub-frozen") && !block.classList.contains("sub-live"), "class 换 live→frozen")
  assert.equal(block.open, false, "折叠")
  assert.ok(!block.querySelector(".sub-stop-btn"), "⏹ 移除")
  const hdr = block.querySelector(".sub-hdr").textContent
  assert.ok(hdr.includes("✓") && hdr.includes("done"), "冻结头 ✓ done")
  assert.equal(S._subBlocks.get("sub:explore#7"), block, "map 键仍在（幂等守卫基座）")
  // settled → awaitingDigest 驻留（不归档；态词上屏——回收走 C-3①，全链见 activity-closure）
  applySubagentStatus({ type: "subagent", status: "started", role: "plan", id: 8, pool: true })
  const b2 = S._subBlocks.get("sub:plan#8")
  feedText(b2, "report tail")
  applySubagentStatus({ type: "subagent", status: "settled", role: "plan", id: 8 })
  assert.ok(b2.classList.contains("sub-frozen") && b2.open === false, "settled 折叠（两态机不变）")
  assert.equal(b2.parentNode, ctx.activityEl, "驻留区内（等回收）")
  assert.equal(b2._subMeta.awaitingDigest, true, "awaitingDigest 单标志")
  assert.ok(b2.querySelector(".sub-hdr").textContent.includes("awaiting"), "块头含对位态词（R3）")
})

test("T-R4 queued 三分支（AC-CL1）：区内建 ⏳ 头 + 取消 ⏹ → started 翻转 running → 取消移除", async () => {
  const { S, ctx, applySubagentStatus } = await loadWebview()
  fresh({ S, ctx })
  // 分支 1：queued → ⏳ 等待头 + 取消 ⏹（状态区排队信息见 activity-closure T-CL17）
  applySubagentStatus({ type: "subagent", status: "queued", role: "eng-coder", id: 9 })
  const b9 = S._subBlocks.get("sub:eng-coder#9")
  assert.ok(b9, "queued 即建等待头")
  assert.equal(b9.parentNode, ctx.activityEl, "头在活动区内")
  assert.ok(b9.querySelector(".sub-hdr").textContent.includes("⏳"), "⏳ 头标")
  const cancelBtn = b9.querySelector(".sub-stop-btn")
  assert.ok(cancelBtn, "queued 头挂取消 ⏹（F-2）")
  assert.equal(cancelBtn.dataset.subId, "9", "⏹ 携 id")
  assert.equal(cancelBtn.dataset.subRole, "eng-coder", "⏹ 携 role")
  assert.equal(cancelBtn.title, "cancel queue", "queued ⏹ 标签 = cancel queue（en fixture）")
  assert.equal(S._subBlocks.size, 1, "单块")
  // 分支 2：started → 同块翻 running（⏳ 清 → ▶；⏹ 换停标签）
  applySubagentStatus({ type: "subagent", status: "started", role: "eng-coder", id: 9, pool: true, model: "glm-5.3" })
  const hdr2 = b9.querySelector(".sub-hdr").textContent
  assert.ok(hdr2.includes("▶") && !hdr2.includes("⏳"), "started → running 头（▶）")
  assert.equal(b9.querySelector(".sub-stop-btn").title, "Stop this subagent", "running ⏹ 停标签")
  assert.equal(S._subBlocks.size, 1, "翻转不重挂（同块）")
  // 分支 3：cancelled(was:queued) → 等待头移除（不冻结）
  applySubagentStatus({ type: "subagent", status: "queued", role: "plan", id: 5 })
  const b5 = S._subBlocks.get("sub:plan#5")
  assert.ok(b5, "第二等待头")
  applySubagentStatus({ type: "subagent", status: "cancelled", role: "plan", id: 5, was: "queued" })
  assert.equal(b5.isConnected, false, "queued 取消 → 头移除")
  assert.ok(!S._subBlocks.has("sub:plan#5"), "map 同步清")
  assert.ok(!b5.classList.contains("sub-frozen"), "从未启动不冻结（直接移除）")
  assert.equal(b9.isConnected, true, "running 块不受影响")
})

test("T-R7 区显隐（边界——AC-CL1）：空区 children 0 且 `:empty` 规则在位；块入区即现", async () => {
  const { S, ctx, applySubagentStatus } = await loadWebview()
  fresh({ S, ctx })
  assert.equal(ctx.activityEl.children.length, 0, "空区零子元素（零显隐 JS——CSS 判据）")
  assert.ok(ctx.activityEl.matches(":empty"), "空区命中 :empty（隐藏规则选择器有效）")
  applySubagentStatus({ type: "subagent", status: "started", role: "explore", id: 3, pool: true })
  assert.equal(ctx.activityEl.children.length, 1, "块入区即现（子元素 1）")
  assert.ok(!ctx.activityEl.matches(":empty"), "非空区不再命中 :empty")
  assert.equal(subBlocks(ctx).length, 1, "区内单块")
})

test("T-R9 150 消息裁 + 归档块入窗（§14 T-CL9）：live 不计窗；归档块随窗出窗；懒历史锚含归档块", async () => {
  const { S, ctx, applySubagentStatus, ensureBlock, trimOldMessages } = await loadWebview()
  fresh({ S, ctx })
  const live = ensureBlock("sub:eng-coder#3")
  for (let i = 0; i < 151; i++) addMessage(ctx, "m" + i) // 152 顶层元素 → 裁 2
  trimOldMessages(ctx)
  assert.equal([...ctx.messagesEl.children].filter((el) => el.classList.contains("message")).length, 150, "消息窗 = 150（只数会话内容）")
  assert.equal(live.isConnected, true, "live 块不受 150 裁（居住区）")
  assert.equal(live.parentNode, ctx.activityEl, "仍在活动区")
  assert.equal(ensureBlock("sub:eng-coder#3"), live, "通道仍可投喂（live——非 tombstone）")
  assert.equal(streamBlocks(ctx).length, 0, "#messages 零块（live 期不落流）")
  // 归档块 = #messages 居民 → 随 150 窗出入（C-…T-CL9 计数选择器含 .sub-block）
  applySubagentStatus({ type: "subagent", status: "done", role: "eng-coder", id: 3 })
  const archived = S._subBlocks.get("sub:eng-coder#3")
  assert.equal(archived.parentNode, ctx.messagesEl, "终态归档（流内居民）")
  assert.equal(streamBlocks(ctx).length, 1, "归档块在流内")
  for (let i = 0; i < 151; i++) addMessage(ctx, "n" + i)
  trimOldMessages(ctx)
  assert.equal(archived.isConnected, false, "归档块随窗出窗（不是永久 DOM）")
})

test("T-R10 区自滚（边界——AC-CL1）：pin 钉底 / 上滚解 pin 不强拉 / 回底重 pin", async () => {
  const { S, ctx, maybeScrollActivity, initScrollFollow } = await loadWebview()
  fresh({ S, ctx })
  initScrollFollow(ctx) // 区监听绑定（scroll.js 生产路径同函数——含消息区监听）
  const el = ctx.activityEl
  Object.defineProperty(el, "scrollHeight", { value: 500, configurable: true })
  Object.defineProperty(el, "clientHeight", { value: 200, configurable: true })
  maybeScrollActivity(ctx)
  assert.equal(el.scrollTop, Number.MAX_SAFE_INTEGER, "pin 默认钉底（区自滚——块出生/流式帧驱动）")
  el.scrollTop = 290 // gap = 10 < 24 → 近底
  el.dispatchEvent(new window.WheelEvent("wheel"))
  assert.equal(ctx._pinActivity, true, "近底轮滚保持 pin")
  el.scrollTop = 100 // gap = 200 → 上滚
  el.dispatchEvent(new window.WheelEvent("wheel"))
  assert.equal(ctx._pinActivity, false, "上滚解 pin")
  maybeScrollActivity(ctx)
  assert.equal(el.scrollTop, 100, "解 pin 不强拉（上读中——同 #messages 口径）")
  el.scrollTop = 480 // 回底
  el.dispatchEvent(new window.WheelEvent("wheel"))
  assert.equal(ctx._pinActivity, true, "回底重 pin")
  maybeScrollActivity(ctx)
  assert.equal(el.scrollTop, Number.MAX_SAFE_INTEGER, "重 pin 后钉底")
})

test("T-R11 清屏恢复（AC-CL1）：clearMessages 路径 → 区零残留；重建块落区尾（pool/⏹/startedAt）", async () => {
  const { S, ctx, applySubagentStatus, resetActivity } = await loadWebview()
  fresh({ S, ctx })
  applySubagentStatus({ type: "subagent", status: "started", role: "explore", id: 1, pool: true, model: "glm-5.3" })
  applySubagentStatus({ type: "subagent", status: "done", role: "eng-coder", id: 2 }) // 无块终态 → 补桩（折叠 + 归档）
  assert.equal(subBlocks(ctx).length, 1, "清屏前：区内 live 一块（补桩已直归档）")
  assert.equal(streamBlocks(ctx).length, 1, "清屏前：补桩桩块流内可见")
  ctx.messagesEl.replaceChildren() // clearMessages（chat-messages.js case：replaceChildren + resetActivity）
  resetActivity()
  assert.equal(ctx.activityEl.children.length, 0, "区零残留（live 全清）")
  assert.equal(S._subBlocks.size, 0, "簿记清空")
  addMessage(ctx, "h1")
  applySubagentStatus({ type: "subagent", status: "started", role: "explore", id: 1, pool: true, model: "glm-5.3", startedAt: 111 })
  const rebuilt = S._subBlocks.get("sub:explore#1")
  assert.equal(rebuilt.parentNode, ctx.activityEl, "重建块落区（清屏后可恢复）")
  assert.equal(rebuilt, ctx.activityEl.lastElementChild, "落区尾")
  assert.equal(rebuilt._subMeta.pool, true, "pool 保真（不降级）")
  assert.ok(rebuilt.querySelector(".sub-stop-btn"), "⏹ 在（控制面不降级）")
  assert.equal(rebuilt._subMeta.startedAt, 111, "startedAt 保留（elapsed 不丢）")
})

test("T-R12 回合中止（§14 C-7）：resetActivity 只清区子树（live + awaiting）——流内归档块留存", async () => {
  const { S, ctx, applySubagentStatus, resetActivity } = await loadWebview()
  fresh({ S, ctx })
  applySubagentStatus({ type: "subagent", status: "started", role: "explore", id: 1, pool: true })
  const live = S._subBlocks.get("sub:explore#1")
  applySubagentStatus({ type: "subagent", status: "started", role: "eng-coder", id: 2, pool: true })
  const archived = S._subBlocks.get("sub:eng-coder#2")
  feedText(archived, "done report")
  applySubagentStatus({ type: "subagent", status: "done", role: "eng-coder", id: 2 })
  assert.equal(subBlocks(ctx).length, 1, "中止前：区内 live 一块；归档块在流内")
  resetActivity()
  assert.equal(live.isConnected, false, "live 块移除")
  assert.equal(archived.isConnected, true, "流内归档块留存（会话历史——C-7）")
  assert.equal(archived.parentNode, ctx.messagesEl, "归档块不动")
  assert.equal(S._subBlocks.size, 0, "map 清空")
  assert.equal(ctx.activityEl.children.length, 0, "区整体复位")
})

test("T-R13 ⏹ 委托（错误面——AC-CL1）：区内点击 .sub-stop-btn → cancelSubagent 逐字 + 不翻折叠", async () => {
  const { S, ctx, applySubagentStatus } = await loadWebview()
  fresh({ S, ctx })
  // §12.7 手法注：追加式补齐 chat.js 顶层 init 所需 id（对照 installFullIndexFixture 清单
  // 补缺项——append 进既有 DOM、不换夹具——既有 ctx 引用零失效），随后引导真 chat.js 模块图。
  const GRAPH_IDS = ("chat-container session-bar session-arrow new-session-btn panels toolbar at-dropdown " +
    "input-row file-input attach-btn paste-bar paste-badge controls-row auto-btn advisor-btn eng-btn " +
    "plan-btn settings-btn settings-panel settings-close settings-body").split(" ")
  for (const id of GRAPH_IDS) {
    if (document.getElementById(id)) continue
    const el = document.createElement("div")
    el.id = id
    document.body.appendChild(el)
  }
  await import("../webview/chat.js") // 真模块图（顶层挂 ⏹ 委托于活动区——scroll.js 同图）
  applySubagentStatus({ type: "subagent", status: "started", role: "explore", id: 7, pool: true, model: "glm-5.3" })
  const block = S._subBlocks.get("sub:explore#7")
  const btn = block.querySelector(".sub-stop-btn")
  assert.ok(btn, "⏹ 在位（running + pool）")
  const mark = capturedPosts.length
  let witnessed = 0
  const witness = () => { witnessed++ }
  document.addEventListener("click", witness) // document 见证：stopPropagation 真触判据
  const ev = new window.MouseEvent("click", { bubbles: true, cancelable: true })
  btn.dispatchEvent(ev)
  document.removeEventListener("click", witness)
  const posts = capturedPosts.slice(mark).filter((m) => m.type === "cancelSubagent")
  assert.equal(posts.length, 1, "恰一条 cancelSubagent postMessage")
  assert.deepEqual(posts[0], { type: "cancelSubagent", id: 7, role: "explore" }, "载荷逐字（id 数值化）")
  assert.equal(ev.defaultPrevented, true, "preventDefault 真触")
  assert.equal(witnessed, 0, "stopPropagation 真触（document 见证零命中）")
  assert.ok(block.classList.contains("sub-live") && !block.classList.contains("sub-frozen"), "块状态不翻（仍 live）")
  assert.equal(block.open, true, "折叠不翻（open 不变）")
  assert.equal(block.parentNode, ctx.activityEl, "块仍在活动区")
})

test("T-R14 迟来丢弃（错误面——AC-CL1）：归档后 / 被移除后 chunk 一律丢弃（返 null / 冻结守卫）", async () => {
  const { S, ctx, applySubagentStatus, ensureBlock } = await loadWebview()
  fresh({ S, ctx })
  applySubagentStatus({ type: "subagent", status: "started", role: "explore", id: 7, pool: true })
  const block = S._subBlocks.get("sub:explore#7")
  feedText(block, "original")
  applySubagentStatus({ type: "subagent", status: "done", role: "explore", id: 7 })
  assert.equal(ensureBlock("sub:explore#7"), null, "归档后 ensureBlock → null（幂等守卫——含归档块）")
  const before = block.querySelector(".advisor-content").textContent
  appendChunk(block, "text", "late chunk") // appendAdvisorChunk 冻结守卫（不落内容）
  assert.equal(block.querySelector(".advisor-content").textContent, before, "迟来 chunk 丢弃（内容不变）")
  assert.equal(S._subBlocks.size, 1, "不重建（无第二块）")
  // 边缘残留：live 元素被移除（!isConnected）→ tombstone 守卫（条目保留——不重建）
  applySubagentStatus({ type: "subagent", status: "started", role: "eng-coder", id: 8, pool: true })
  const orphan = S._subBlocks.get("sub:eng-coder#8")
  orphan.remove()
  assert.equal(ensureBlock("sub:eng-coder#8"), null, "被移除元素 → tombstone null（连续消息同丢弃）")
  assert.equal(ensureBlock("sub:eng-coder#8"), null, "条目保留作守卫（非一次性删除）")
  assert.ok(S._subBlocks.has("sub:eng-coder#8"), "簿记条目保留至 resetActivity")
})

test("T-R15 error/answered：error 头词 + answered（有块折叠 / 无块 no-op）——均归档落流", async () => {
  const { S, ctx, applySubagentStatus, ensureBlock } = await loadWebview()
  fresh({ S, ctx })
  applySubagentStatus({ type: "subagent", status: "started", role: "eng-coder", id: 1, pool: true })
  const block = S._subBlocks.get("sub:eng-coder#1")
  feedText(block, "partial")
  applySubagentStatus({ type: "subagent", status: "error", role: "eng-coder", id: 1, error: "boom" })
  assert.ok(block.classList.contains("sub-frozen"), "error 冻结")
  assert.equal(block.parentNode, ctx.messagesEl, "折叠 + 即时归档（C-3）")
  const hdr = block.querySelector(".sub-hdr").textContent
  assert.ok(hdr.includes("error"), "error 头词")
  assert.ok(hdr.includes("boom"), "错误注记随头")
  assert.equal(block.open, false)
  // answered：有块折叠（consult 终态驱动保留）/ 无块 no-op（回复走 digest 呈现）
  const b = ensureBlock("sub:consult glm-x #7")
  feedText(b, "streamed")
  applySubagentStatus({ type: "subagent", status: "answered", role: "consult", id: 7, model: "glm-x", sessionId: 7 })
  assert.ok(b.classList.contains("sub-frozen"), "answered（有块）折叠")
  assert.equal(b.parentNode, ctx.messagesEl, "answered 归档落流")
  assert.ok(b.querySelector(".sub-hdr").textContent.includes("✓"), "折叠头 ✓ done")
  applySubagentStatus({ type: "subagent", status: "answered", role: "consult", id: 9, model: "glm-y", sessionId: 9 })
  assert.equal(S._subBlocks.size, 2, "无块 answered 不建块（no-op）")
  assert.equal(subBlocks(ctx).length, 0, "区无第二块（无悬空驻留）")
  assert.equal(streamBlocks(ctx).length, 2, "两块均归档（流内）")
})

test("多并行：两 spawn 两独立块（区内）——互不干扰各自终态", async () => {
  const { S, ctx, applySubagentStatus } = await loadWebview()
  fresh({ S, ctx })
  applySubagentStatus({ type: "subagent", status: "queued", role: "explore", id: 1 })
  applySubagentStatus({ type: "subagent", status: "started", role: "eng-coder", id: 2, pool: true })
  const b1 = S._subBlocks.get("sub:explore#1")
  const b2 = S._subBlocks.get("sub:eng-coder#2")
  assert.ok(b1 && b2 && b1 !== b2, "两独立块")
  assert.equal(subBlocks(ctx).length, 2)
  feedText(b1, "r1")
  applySubagentStatus({ type: "subagent", status: "done", role: "explore", id: 1 })
  assert.ok(b1.classList.contains("sub-frozen"), "块 1 冻结")
  assert.equal(b1.parentNode, ctx.messagesEl, "块 1 归档")
  assert.ok(!b2.classList.contains("sub-frozen") && b2.isConnected, "块 2 仍 live（互不干扰）")
  assert.equal(b2.parentNode, ctx.activityEl, "块 2 留区")
  applySubagentStatus({ type: "subagent", status: "done", role: "eng-coder", id: 2 })
  assert.ok(b2.classList.contains("sub-frozen"), "块 2 独立冻结")
  assert.equal(b2.parentNode, ctx.messagesEl, "块 2 归档")
})

test("重复 started：同频道二次 started 覆盖式刷新头词——不重挂（区内）", async () => {
  const { S, ctx, applySubagentStatus } = await loadWebview()
  fresh({ S, ctx })
  applySubagentStatus({ type: "subagent", status: "started", role: "explore", id: 7, pool: true, model: "glm-5.3", turn: 1, maxTurns: 100 })
  const block = S._subBlocks.get("sub:explore#7")
  const first = block.querySelector(".sub-hdr").textContent
  assert.ok(first.includes("glm-5.3"), "首 started 水合 model")
  applySubagentStatus({ type: "subagent", status: "started", role: "explore", id: 7, pool: true, model: "glm-5.3", turn: 2, maxTurns: 100 })
  assert.equal(subBlocks(ctx).length, 1, "二次 started 不重挂（单块）")
  assert.equal(S._subBlocks.get("sub:explore#7"), block, "同元素（map 有键 live → 返回既有）")
  const second = block.querySelector(".sub-hdr").textContent
  assert.ok(second.includes("turn 2/100"), "二次 started 覆盖式刷新头词（turn 续延）")
  assert.ok(!block.classList.contains("sub-frozen"), "重复 started 不翻终态")
})

// ─── A13（群 A 批）：首块说明行（设计权威：WEBVIEW.md §11.2——C-MA13-1..4 / T-MA13-1..3）───

test("T-MA13-1 首块说明行：首块含 .sub-desc 且文案 = t('sub.desc')；第二块零 .sub-desc（一次性）", async () => {
  const { S, ctx, applySubagentStatus } = await loadWebview()
  fresh({ S, ctx })
  const { t } = await import("../webview/i18n.js")
  S._subDescShown = false // 会话起点（本档其他用例已置位——显式复位）
  applySubagentStatus({ type: "subagent", status: "started", role: "explore", id: 21, pool: true })
  const first = S._subBlocks.get("sub:explore#21")
  const desc = first.querySelector(".sub-desc")
  assert.ok(desc, "首块含说明行")
  assert.equal(desc.textContent, t("sub.desc"), "文案 = locale 键 sub.desc")
  assert.equal(desc.parentNode, first, "details 直接子")
  assert.equal(desc.previousElementSibling.tagName, "SUMMARY", "位于 summary 之后")
  assert.equal(desc.nextElementSibling.className, "advisor-content", "位于 .advisor-content 之前")
  assert.equal(S._subDescShown, true, "一次性标志置位")
  applySubagentStatus({ type: "subagent", status: "started", role: "explore", id: 22, pool: true })
  const second = S._subBlocks.get("sub:explore#22")
  assert.equal(second.querySelector(".sub-desc"), null, "第二块零说明行（一次性）")
})

test("T-MA13-2 边界：resetActivity() 后新块出生 → 零 .sub-desc（会话内已示——不重复）", async () => {
  const { S, ctx, applySubagentStatus, resetActivity } = await loadWebview()
  fresh({ S, ctx })
  S._subDescShown = false
  applySubagentStatus({ type: "subagent", status: "started", role: "plan", id: 23, pool: true })
  assert.ok(S._subBlocks.get("sub:plan#23").querySelector(".sub-desc"), "首块已示")
  resetActivity()
  assert.equal(S._subDescShown, true, "标志不随 resetActivity 复位（panel 会话生命周期内一次）")
  applySubagentStatus({ type: "subagent", status: "started", role: "plan", id: 24, pool: true })
  assert.equal(S._subBlocks.get("sub:plan#24").querySelector(".sub-desc"), null, "清屏后新块零 .sub-desc")
})

test("T-MA13-3 回归（双面）：Task/Goal 面板说明句在场 + locale 双键（sub.desc en/zh）", async () => {
  const { S, ctx } = await loadWebview()
  const { renderTaskPanel, renderGoalPanel } = await import("../webview/panels.js")
  S._taskProgress = { items: [{ title: "步骤一", status: "pending" }] }
  S._goalInfo = { objective: "目标", criteria: "标准", status: "active" }
  renderTaskPanel()
  renderGoalPanel()
  assert.ok(document.getElementById("task-panel").innerHTML.includes("panel-desc"), "Task 面板说明句在场（防误删）")
  assert.ok(document.getElementById("goal-panel").innerHTML.includes("panel-desc"), "Goal 面板说明句在场（防误删）")
  void ctx
  const { readFileSync: readFile } = await import("node:fs")
  for (const f of ["../locales/en.json", "../locales/zh.json"]) {
    const j = JSON.parse(readFile(new URL(f, import.meta.url), "utf8"))
    assert.equal(typeof j["sub.desc"], "string", `${f} 含 sub.desc`)
    assert.ok(j["sub.desc"].length > 0, `${f} sub.desc 非空`)
  }
})
