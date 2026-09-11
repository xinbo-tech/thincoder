/**
 * activity-flow.test.mjs — ACTIVITY-REWRITE-SIMPLE 全族重写（B1 流尾形态——设计档用例表
 * 逐行：出生/内容/终态折叠/settled/queued 三分支含取消 ⏹/迟来/多并行/会话清/reload/
 * 150 裁（冻结+live tombstone）/error/answered/重复 started）。手法：installChatFixture
 * 后动态 import 真模块，直接驱动 activity 导出 + ui.appendAdvisorChunk。无真实定时器。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { setupWebview, installChatFixture } from "./helpers/webview-env.mjs"

let cleanupEnv
let appendChunk // ui.appendAdvisorChunk（loadWebview 赋值——feedText 用）

before(() => {
  const env = setupWebview()
  cleanupEnv = env.cleanup
  installChatFixture()
})

after(() => {
  cleanupEnv()
})

/** 动态 import 真模块（模块缓存——每文件一次；必须在 setupWebview 之后）。 */
async function loadWebview() {
  const state = await import("../webview/state.js")
  const ui = await import("../webview/ui.js")
  const activity = await import("../webview/activity.js")
  appendChunk = ui.appendAdvisorChunk
  return { S: state.S, ctx: state.ctx, trimOldMessages: ui.trimOldMessages, ...activity }
}

/** 逐测冷启复位（node --test 同文件串行——模块缓存共享同一 S/ctx——每测独立起点）。 */
function fresh({ S, ctx }) {
  ctx.messagesEl.replaceChildren()
  S._subBlocks.clear()
  ctx._pinBottom = undefined
}

/** 造一条会话消息（.message——窗口裁剪/兄弟序用）。 */
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

/** #messages 内 .sub-block 直接子元素（多块/重复断言用）。 */
function subBlocks(ctx) {
  return [...ctx.messagesEl.children].filter((el) => el.classList.contains("sub-block"))
}
/** 直接子元素序号（无 DOM move 断言用——位置不变）。 */
function idxOf(el) {
  return [...el.parentNode.children].indexOf(el)
}

// ─── 用例表逐行 ──────────────────────────────────

test("出生：pool started 消息建块 append #messages 流尾——label 去 sub: 前缀（AC-2）", async () => {
  const { S, ctx, applySubagentStatus } = await loadWebview()
  fresh({ S, ctx })
  addMessage(ctx, "m1")
  applySubagentStatus({ type: "subagent", status: "started", role: "explore", id: 7, pool: true, model: "glm-5.3" })
  const block = S._subBlocks.get("sub:explore#7")
  assert.ok(block, "started 建块")
  assert.equal(block.parentNode, ctx.messagesEl, "块 append #messages（出生即流尾——AC-2）")
  assert.equal(block, ctx.messagesEl.lastElementChild, "出生位 = #messages 流尾")
  assert.equal(idxOf(block), 1, "排在 m1 后（流尾 append——非嵌入）")
  assert.ok(block.classList.contains("sub-live") && !block.classList.contains("sub-frozen"), "live 态")
  assert.equal(block._subMeta.label, "explore#7", "label = 频道去 sub: 前缀")
  const hdr = block.querySelector(".sub-hdr").textContent
  assert.ok(hdr.includes("▶") && hdr.includes("explore#7") && !hdr.includes("sub:"), "头词 [▶ explore#7…] 无 sub: 前缀")
  assert.equal(S._subBlocks.size, 1)
})

test("内容：chunk appendAdvisorChunk 进块（tool/text 行）", async () => {
  const { S, ctx, ensureBlock } = await loadWebview()
  fresh({ S, ctx })
  const block = ensureBlock("sub:eng-coder#1")
  appendChunk(block, "tool", "read x.mjs")
  feedText(block, "report line one\nreport line two")
  const content = block.querySelector(".advisor-content")
  assert.ok(content.textContent.includes("read x.mjs"), "tool 行在内容区")
  assert.ok(content.textContent.includes("report line two"), "text 行在内容区（尾部完整）")
})

test("终态折叠：done 原地折叠——无 DOM move——class 换 + open=false + ⏹ 移除（AC-3）", async () => {
  const { S, ctx, applySubagentStatus } = await loadWebview()
  fresh({ S, ctx })
  addMessage(ctx, "m1")
  applySubagentStatus({ type: "subagent", status: "started", role: "explore", id: 7, pool: true, model: "glm-5.3" })
  const block = S._subBlocks.get("sub:explore#7")
  const bornIdx = idxOf(block)
  assert.ok(block.querySelector(".sub-stop-btn"), "running+pool → ⏹ 在位")
  applySubagentStatus({ type: "subagent", status: "done", role: "explore", id: 7, turn: 4 })
  assert.equal(block.parentNode, ctx.messagesEl, "仍挂 #messages（无 DOM move——AC-3）")
  assert.equal(idxOf(block), bornIdx, "位置 == 出生位（原地折叠——无落流移动）")
  assert.ok(block.classList.contains("sub-frozen") && !block.classList.contains("sub-live"), "class 换 live→frozen")
  assert.equal(block.open, false, "折叠")
  assert.ok(!block.querySelector(".sub-stop-btn"), "⏹ 移除")
  const hdr = block.querySelector(".sub-hdr").textContent
  assert.ok(hdr.includes("✓") && hdr.includes("done"), "冻结头 ✓ done")
  assert.equal(S._subBlocks.get("sub:explore#7"), block, "map 键仍在（幂等守卫基座）")
})

test("settled 视同 done：即时折叠（无 awaiting 驻留）", async () => {
  const { S, ctx, applySubagentStatus } = await loadWebview()
  fresh({ S, ctx })
  applySubagentStatus({ type: "subagent", status: "started", role: "explore", id: 7, pool: true })
  const block = S._subBlocks.get("sub:explore#7")
  feedText(block, "report tail")
  applySubagentStatus({ type: "subagent", status: "settled", role: "explore", id: 7 })
  assert.ok(block.classList.contains("sub-frozen"), "settled 即冻结（无驻留态）")
  assert.equal(block.open, false, "settled 折叠")
  const hdr = block.querySelector(".sub-hdr").textContent
  assert.ok(hdr.includes("✓") && hdr.includes("done"), "settled 头 = ✓ done（视同 done——无 awaiting 词）")
  assert.ok(!hdr.includes("awaiting"), "无 awaiting digestion 词")
})

test("queued 三分支（AC-4）：建 ⏳ 头 + 取消 ⏹ → started 翻转 running → 取消移除", async () => {
  const { S, ctx, applySubagentStatus } = await loadWebview()
  fresh({ S, ctx })
  // 分支 1：queued → ⏳ 等待头 + 取消 ⏹
  applySubagentStatus({ type: "subagent", status: "queued", role: "eng-coder", id: 9 })
  const b9 = S._subBlocks.get("sub:eng-coder#9")
  assert.ok(b9, "queued 即建等待头")
  assert.equal(b9.parentNode, ctx.messagesEl, "头在 #messages 流内")
  assert.ok(b9.querySelector(".sub-hdr").textContent.includes("⏳"), "⏳ 头标")
  assert.ok(!b9.querySelector(".sub-hdr").textContent.includes("position"), "无位置词（position/waiting 词删）")
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

test("迟来丢弃：终态后 chunk/ensureBlock 返 null——不复活不重建", async () => {
  const { S, ctx, applySubagentStatus, ensureBlock } = await loadWebview()
  fresh({ S, ctx })
  applySubagentStatus({ type: "subagent", status: "started", role: "explore", id: 7, pool: true })
  const block = S._subBlocks.get("sub:explore#7")
  feedText(block, "original")
  applySubagentStatus({ type: "subagent", status: "done", role: "explore", id: 7 })
  assert.equal(ensureBlock("sub:explore#7"), null, "终态频道 ensureBlock → null（幂等守卫）")
  const before = block.querySelector(".advisor-content").textContent
  appendChunk(block, "text", "late chunk") // appendAdvisorChunk 冻结守卫（不落内容）
  assert.equal(block.querySelector(".advisor-content").textContent, before, "迟来 chunk 丢弃（内容不变）")
  assert.equal(S._subBlocks.size, 1, "不重建（无第二块）")
})

test("多并行：两 spawn 两独立块——互不干扰各自终态", async () => {
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
  assert.ok(!b2.classList.contains("sub-frozen") && b2.isConnected, "块 2 仍 live（互不干扰）")
  applySubagentStatus({ type: "subagent", status: "done", role: "eng-coder", id: 2 })
  assert.ok(b2.classList.contains("sub-frozen"), "块 2 独立冻结")
})

test("会话清：resetActivity 移除 .sub-live + 清 map——frozen 不动", async () => {
  const { S, ctx, applySubagentStatus, resetActivity } = await loadWebview()
  fresh({ S, ctx })
  applySubagentStatus({ type: "subagent", status: "started", role: "explore", id: 1, pool: true })
  const live = S._subBlocks.get("sub:explore#1")
  applySubagentStatus({ type: "subagent", status: "started", role: "eng-coder", id: 2, pool: true })
  const frozen = S._subBlocks.get("sub:eng-coder#2")
  feedText(frozen, "done report")
  applySubagentStatus({ type: "subagent", status: "done", role: "eng-coder", id: 2 })
  resetActivity()
  assert.equal(live.isConnected, false, "live 块移除（流内）")
  assert.equal(S._subBlocks.size, 0, "map 清空")
  assert.equal(subBlocks(ctx).length, 1, "仅剩 frozen 块")
  assert.equal(frozen.isConnected, true, "frozen 块保留（会话流历史）")
})

test("never-born 终态补桩（第 10 批新口径——原「reload 无恢复」用例改写）：family+合法 id → 补已折叠桩 + `late-terminal-stub`；非 family（consult）→ no-op + `drop-unknown-role`", async () => {
  const { S, ctx, applySubagentStatus } = await loadWebview()
  fresh({ S, ctx })
  S._subTraceLog = []
  addMessage(ctx, "history")
  // never-born 终态（出生事件丢失/投递失败后的终态到达——旧口径 no-op，现补桩）
  applySubagentStatus({ type: "subagent", status: "done", role: "explore", id: 7 })
  const stub = S._subBlocks.get("sub:explore#7")
  assert.ok(stub, "family + 合法 id → 补桩")
  assert.ok(stub.classList.contains("sub-frozen"), "补桩即折叠（live→frozen）")
  assert.equal(stub._subMeta.frozen, true, "_subMeta.frozen === true")
  assert.ok(stub.querySelector(".sub-hdr").textContent.includes("done"), "桩头词含 done")
  assert.equal(stub.parentNode, ctx.messagesEl, "桩仍落 #messages 流内（出生位）")
  assert.equal(S._subTraceLog.filter((e) => e.kind === "late-terminal-stub").length, 1, "`late-terminal-stub` 痕迹恰一条")
  // 非 family（consult——键嵌 model）→ 不补桩 + drop-unknown-role 痕迹
  const before = subBlocks(ctx).length
  applySubagentStatus({ type: "subagent", status: "terminated", role: "consult", id: 4, model: "glm-x", sessionId: 4 })
  assert.equal(subBlocks(ctx).length, before, "consult（非 family）不补桩（no-op）")
  assert.equal(S._subBlocks.size, 1, "map 无新增条目")
  assert.ok(S._subTraceLog.some((e) => e.kind === "drop-unknown-role"), "`drop-unknown-role` 痕迹在位")
})

test("150 裁（冻结）：冻结块随窗裁——map 终态守卫仍丢迟来消息", async () => {
  const { S, ctx, applySubagentStatus, ensureBlock, trimOldMessages } = await loadWebview()
  fresh({ S, ctx })
  applySubagentStatus({ type: "subagent", status: "started", role: "explore", id: 7, pool: true })
  const frozen = S._subBlocks.get("sub:explore#7")
  feedText(frozen, "old report")
  applySubagentStatus({ type: "subagent", status: "done", role: "explore", id: 7 })
  for (let i = 0; i < 151; i++) addMessage(ctx, "m" + i) // +151 → 152 元素 → 裁 2
  trimOldMessages(ctx)
  assert.equal(frozen.isConnected, false, "最旧冻结块被 150 窗裁")
  assert.equal([...ctx.messagesEl.children].filter((el) => el.classList.contains("message")).length, 150, "窗内 150 消息")
  assert.equal(ensureBlock("sub:explore#7"), null, "迟来消息守卫丢（frozen 条目保留 → null）")
})

test("150 裁（live 运行中）：live 块出生即计窗——被裁 → tombstone 守卫——后续消息一律丢弃", async () => {
  const { S, ctx, ensureBlock, trimOldMessages, resetActivity } = await loadWebview()
  fresh({ S, ctx })
  const live = ensureBlock("sub:eng-coder#3") // 出生即 #messages——150 无豁免
  for (let i = 0; i < 151; i++) addMessage(ctx, "m" + i)
  trimOldMessages(ctx)
  assert.equal(live.isConnected, false, "live 块成最旧被裁（无豁免——出生即计窗）")
  assert.equal(ensureBlock("sub:eng-coder#3"), null, "被裁后消息丢弃（tombstone 守卫——不重建）")
  assert.equal(ensureBlock("sub:eng-coder#3"), null, "连续消息同样丢弃（条目保留作守卫——非一次性删除）")
  assert.ok(S._subBlocks.has("sub:eng-coder#3"), "簿记条目保留（守卫直至 resetActivity——与冻结条目同生命周期）")
  resetActivity()
  assert.ok(!S._subBlocks.has("sub:eng-coder#3"), "resetActivity 清簿记——条目释放")
})

test("error：error 消息终态折叠 + error 头词", async () => {
  const { S, ctx, applySubagentStatus } = await loadWebview()
  fresh({ S, ctx })
  applySubagentStatus({ type: "subagent", status: "started", role: "eng-coder", id: 1, pool: true })
  const block = S._subBlocks.get("sub:eng-coder#1")
  feedText(block, "partial")
  applySubagentStatus({ type: "subagent", status: "error", role: "eng-coder", id: 1, error: "boom" })
  assert.ok(block.classList.contains("sub-frozen"), "error 冻结")
  const hdr = block.querySelector(".sub-hdr").textContent
  assert.ok(hdr.includes("error"), "error 头词")
  assert.ok(hdr.includes("boom"), "错误注记随头")
  assert.equal(block.open, false)
})

test("answered（有块）折叠 / （无块）no-op", async () => {
  const { S, ctx, ensureBlock, applySubagentStatus } = await loadWebview()
  fresh({ S, ctx })
  // 有块：consult 频道块 + answered → 折叠（consult 终态驱动保留）
  const b = ensureBlock("sub:consult glm-x #7")
  feedText(b, "streamed")
  applySubagentStatus({ type: "subagent", status: "answered", role: "consult", id: 7, model: "glm-x", sessionId: 7 })
  assert.ok(b.classList.contains("sub-frozen"), "answered（有块）折叠")
  assert.ok(b.querySelector(".sub-hdr").textContent.includes("✓"), "折叠头 ✓ done")
  // 无块：answered 无活动块 → no-op（回复走 digest 呈现——不建防御块）
  applySubagentStatus({ type: "subagent", status: "answered", role: "consult", id: 9, model: "glm-y", sessionId: 9 })
  assert.equal(S._subBlocks.size, 1, "无块 answered 不建块（no-op）")
  assert.equal(subBlocks(ctx).length, 1, "无第二块")
})

test("重复 started：同频道二次 started 覆盖式刷新头词——不重挂", async () => {
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
test("suspension 退出兜底：freezeLiveBlocks 折叠残余 live 块（settled 已即时折叠后仅剩 live）", async () => {
  const { S, ctx, applySubagentStatus, freezeLiveBlocks } = await loadWebview()
  fresh({ S, ctx })
  applySubagentStatus({ type: "subagent", status: "started", role: "explore", id: 1, pool: true })
  const live = S._subBlocks.get("sub:explore#1")
  applySubagentStatus({ type: "subagent", status: "started", role: "eng-coder", id: 2, pool: true })
  const live2 = S._subBlocks.get("sub:eng-coder#2")
  feedText(live, "residual")
  freezeLiveBlocks()
  assert.ok(live.classList.contains("sub-frozen"), "残余 live 块随会话退出折叠")
  assert.ok(live2.classList.contains("sub-frozen"), "全部 live 折叠（不留悬空）")
  assert.equal(live.parentNode, ctx.messagesEl, "原地折叠（不移动）")
})
