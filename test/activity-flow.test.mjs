/**
 * activity-flow.test.mjs — SESSION-ACTIVITY-REVISED 测试（子代理活动区回归 + freeze
 * 落流锚 + queued 等待块头 + consult 频道块 + Stop running 派生侧块规则）。
 * docs/design/SESSION-ACTIVITY-REVISED.md §7（改 ①-⑥ + 保 ⑦⑧ + 新 ⑨-⑮——AC-1~6）。
 *
 * 手法（webview 侧 happy-dom——webview-turnstate.test.mjs 模式）：setupWebview +
 * installChatFixture（含 #subagent-activity 活动区容器）后动态 import 真模块
 * （state.js/ui.js/activity.js——单一运行时对象 S/ctx），直接驱动 activity 导出
 * （ensureBlock/applySubagentStatus/freezeBlock/freezeSettledBlocks/resetActivity/
 * parseChannel/blockNamesFor）与 ui.appendAdvisorChunk（块内容行——appendPreview 的
 * text 行来源）。不引导 chat.js/panels.js 全量模块图。ticker seam：
 * setActivityTickDisabled(true)——无真实 interval（假时钟 activityTick 手动驱动——
 * 本组不测 elapsed 漂移）。快层直跑（全部 <800ms——无真实定时器）。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { setupWebview, installChatFixture } from "./helpers/webview-env.mjs"

// ─── happy-dom 环境（必须先于 webview 模块 import——state.js 顶层读 DOM + acquireVsCodeApi）───

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
  activity.setActivityTickDisabled(true) // ticker seam——无真实 1s interval
  appendChunk = ui.appendAdvisorChunk
  return {
    S: state.S, ctx: state.ctx,
    trimOldMessages: ui.trimOldMessages,
    ...activity,
  }
}

/** 逐测冷启复位（node --test 同文件串行——模块缓存共享同一 S/ctx——每测独立起点）。
 *  活动区随 messages 一起清空 + 隐藏（⑨ 区空隐藏的确定性起点）。 */
function fresh({ S, ctx }) {
  ctx.messagesEl.replaceChildren()
  ctx.subAgentArea.replaceChildren()
  ctx.subAgentArea.style.display = "none"
  S._subBlocks.clear()
  S._subagentMap = {}
  ctx._pinBottom = undefined
}

/** 直接子元素序号（#messages 落流位置断言用——DOM move 红线反转面）。 */
function idxOf(el) {
  return [...el.parentNode.children].indexOf(el)
}

/** 造一条会话消息（.message——窗口裁剪/兄弟序用）。 */
function addMessage(ctx, cls = "user", tag = null) {
  const el = document.createElement("div")
  el.className = `message ${cls}`
  if (tag) el.dataset.tag = tag
  ctx.messagesEl.appendChild(el)
  return el
}

/** 往块内容灌一个 text 行（appendPreview 的 report 来源——真 appendAdvisorChunk）。 */
function feedText(block, text) {
  appendChunk(block, "text", text)
}

// ─── ① 出生固定活动区（AC-1——F-1/F-5）+ 区底 pin（messages 零扰动）──────────

test("① live 块出生在固定活动区（#subagent-activity——messages 零扰动）+ 区内钉底", async () => {
  const { S, ctx, ensureBlock } = await loadWebview()
  fresh({ S, ctx })
  const m1 = addMessage(ctx, "user", "m1")
  const m2 = addMessage(ctx, "assistant", "m2")
  const area = ctx.subAgentArea
  ctx.messagesEl.scrollTop = 0

  // 区溢出时的新块出生 → 区底 pin（区内自滚管理——F-2）：伪造区尺寸——近底时出生滚到底
  Object.defineProperty(area, "scrollHeight", { value: 500, configurable: true })
  Object.defineProperty(area, "clientHeight", { value: 200, configurable: true })
  area.scrollTop = 300 // 近底（500-200-32=268 阈值内）——钉底应滚到 500
  const block = ensureBlock("sub:eng-coder#1")

  assert.equal(block.parentNode, area, "块直接挂在活动区容器（非 #messages——live 固定可见）")
  assert.equal(block, area.lastElementChild, "区内出生位 = 区尾（新块追加序）")
  assert.equal(area.children.length, 1, "区内容 = 恰此块")
  assert.equal(area.style.display, "", "区有块即显（⑨ 显侧）")
  assert.equal(ctx.messagesEl.children.length, 2, "messages 零扰动（m1/m2 原样——live 不入流）")
  assert.equal(ctx.messagesEl.scrollTop, 0, "messages 滚动零扰动（不再出生即钉 messages 底）")
  assert.ok(block.classList.contains("advisor-block") && block.classList.contains("sub-block") && block.classList.contains("sub-live"), "块类：advisor-block + sub-block + sub-live")
  assert.equal(S._subBlocks.size, 1, "map 登记")
  assert.equal(area.scrollTop, 500, "区内钉底：近底出生 → 区滚到底（区内自滚管理——不碰 messages）")

  // 上读（区顶）时出生不强拉（pin 语义——与 messagesEl pinBottom 同构）
  area.scrollTop = 0
  ensureBlock("sub:eng-coder#2")
  assert.equal(area.scrollTop, 0, "用户上读中出生不抢区滚动（pin 豁免）")
  assert.equal(area.children.length, 2, "两块顺序堆叠区中")
  assert.equal(S._subBlocks.size, 2)
  // 伪造尺寸复原（防串扰后续测试）
  delete area.scrollHeight
  delete area.clientHeight
  area.scrollTop = 0
})

// ─── ② freeze 落流尾推（AC-4——DOM move 红线反转——原 N3 无 move 删）─────────

test("② freeze 移入 #messages 尾：普通 done/error/stopped（非挂起）尾推 + preview 紧跟——无原地折叠", async () => {
  const { S, ctx, applySubagentStatus } = await loadWebview()
  fresh({ S, ctx })
  const m1 = addMessage(ctx, "user", "m1")
  // started（池条目——started 建块 + refreshBlock——⏹ 面见 ⑦）
  applySubagentStatus({ type: "subagent", status: "started", role: "eng-coder", id: 1, pool: true, model: "glm-5.3", maxTurns: 100, turn: 1 })
  const block = S._subBlocks.get("sub:eng-coder#1")
  assert.ok(block, "started 建块")
  assert.equal(block.parentNode, ctx.subAgentArea, "live 在活动区（出生位 = 区）")
  feedText(block, "report line 1\nreport line 2")

  // 普通 done（非挂起——无 settle 中间态）→ freeze 移入 #messages 流尾（DOM move）
  applySubagentStatus({ type: "subagent", status: "done", role: "eng-coder", id: 1, turn: 4 })
  assert.equal(block.parentNode, ctx.messagesEl, "冻结后移入 #messages（DOM move——B1 无 move 红线反转）")
  assert.equal(idxOf(block), 1, "落流位置 = #messages 当前尾（m1 后）")
  assert.equal(block.previousElementSibling, m1, "前序 = 流尾消息")
  assert.ok(block.classList.contains("sub-frozen") && !block.classList.contains("sub-live"), "class 换 sub-live → sub-frozen")
  assert.equal(block.open, false, "冻结折叠")
  assert.ok(!block.querySelector(".sub-stop-btn"), "⏹ 移除")
  const frozenHdr = block.querySelector(".sub-hdr").textContent
  assert.ok(frozenHdr.includes("✓") && frozenHdr.includes("done"), "冻结头 ✓ done")
  assert.ok(frozenHdr.includes("turn 4/100"), "终态 turn 快照延续")
  const preview = block.nextElementSibling
  assert.ok(preview?.classList.contains("sub-report-preview"), "done → preview 紧跟块（落流内）")
  assert.ok(preview.textContent.includes("report line 2"), "preview 内容 = 报告尾")
  assert.equal(ctx.subAgentArea.children.length, 0, "块已离区（区空）")

  // error 形态（另一块）：冻结 + preview 紧跟
  const { ensureBlock } = await loadWebview()
  const eblock = ensureBlock("sub:explore#2")
  assert.equal(eblock.parentNode, ctx.subAgentArea, "live 在区")
  feedText(eblock, "err report")
  applySubagentStatus({ type: "subagent", status: "error", role: "explore", id: 2, error: "boom" })
  assert.equal(eblock.parentNode, ctx.messagesEl, "error 落流")
  assert.ok(eblock.nextElementSibling?.classList.contains("sub-report-preview"), "error → preview 紧跟块")
  const ehdr = eblock.querySelector(".sub-hdr").textContent
  assert.ok(ehdr.includes("⏹") && ehdr.includes("error"), "error 头 ⏹ error")
  assert.ok(eblock.classList.contains("sub-frozen"), "error 冻结")

  // stopped 形态（再一块）：冻结但无 preview（CLI parity）
  const sblock = ensureBlock("sub:plan#3")
  feedText(sblock, "partial work")
  applySubagentStatus({ type: "subagent", status: "cancelled", role: "plan", id: 3 })
  assert.equal(sblock.parentNode, ctx.messagesEl, "stopped 落流")
  assert.ok(!sblock.nextElementSibling || !sblock.nextElementSibling.classList.contains("sub-report-preview"), "stopped 无 preview（尾块后无 preview）")
  assert.ok(sblock.querySelector(".sub-hdr").textContent.includes("stopped"), "stopped 头词")
  assert.ok(sblock.classList.contains("sub-frozen"), "stopped 亦冻结")
})

// ─── ③ settled 驻留活动区 + digest 报告流内 + done 插报告前（_freezeAtEl 锚）───

test("③ settled 驻留区：settle 后块留活动区（awaiting digestion）——digest 报告 append 流内——done 插报告前（_freezeAtEl 锚断言——AC-4）", async () => {
  const { S, ctx, applySubagentStatus } = await loadWebview()
  fresh({ S, ctx })
  const m1 = addMessage(ctx, "user", "m1")
  applySubagentStatus({ type: "subagent", status: "started", role: "explore", id: 7, pool: true })
  const block = S._subBlocks.get("sub:explore#7")
  assert.ok(block)
  feedText(block, "settle report tail") // digest done 冻结时 appendPreview 的 report 源

  // settle（挂起期——不冻结——块留活动区——✓ awaiting digestion 头——记落流锚）
  applySubagentStatus({ type: "subagent", status: "settled", role: "explore", id: 7 })
  assert.equal(block.parentNode, ctx.subAgentArea, "settled 驻留活动区（不入流）")
  assert.ok(block.classList.contains("sub-live") && !block.classList.contains("sub-frozen"), "settle 不冻结（仍 live）")
  assert.ok(block.querySelector(".sub-hdr").textContent.includes("awaiting digestion"), "awaiting-digestion 词在位")
  assert.equal(block._subMeta._freezeAtEl, m1, "落流锚 = settle 时 #messages 流尾（m1）")
  assert.ok(block._subMeta.settleSeq > 0, "settle 序记录")
  assert.equal(ctx.messagesEl.children.length, 1, "messages 仍只有 m1")

  // digest 回合渲染报告（新 .message append 到流——排在锚后）
  const report = addMessage(ctx, "assistant", "report")
  assert.equal(report.previousElementSibling, m1, "digest 报告排锚后（流内）")
  assert.equal(block.parentNode, ctx.subAgentArea, "报告 append 不移动区中 settled 块")

  // digest done → 块按锚插回报告前（digest 报告前——reclaim 补发序）
  applySubagentStatus({ type: "subagent", status: "done", role: "explore", id: 7 })
  assert.equal(block.parentNode, ctx.messagesEl, "done → 落流（DOM move）")
  assert.equal(idxOf(block), 1, "落流位置 = 锚后第一（m1 < block）")
  assert.equal(block.previousElementSibling, m1, "前序 = 锚（settle 时流尾）")
  assert.ok(block.nextElementSibling?.classList.contains("sub-report-preview"), "preview 紧跟块")
  assert.equal(block.nextElementSibling.nextElementSibling, report, "digest 报告仍在块后（块插报告前）")
  assert.equal(ctx.subAgentArea.children.length, 0, "区清空")
})

// ─── ④ sync 区内出生与父流并行 + 冻结落当前尾（F-5——freeze 不强制滚动）───────

test("④ 同步子代理区内出生父流并行：父段/父新块 append 不动区块——freeze 落 #messages 当前尾", async () => {
  const { S, ctx, ensureBlock, freezeBlock } = await loadWebview()
  fresh({ S, ctx })
  // 父回合进行中：父块已挂 #messages（sync spawn 无 started 建块——首 chunk 建块面）
  const parent = addMessage(ctx, "assistant", "parent1")
  const bubble = document.createElement("div")
  bubble.className = "bubble content"
  parent.appendChild(bubble)
  bubble.textContent = "parent stream…"

  const block = ensureBlock("sub:eng-coder#5") // 父块存在时出生 → 活动区（非流内）
  assert.equal(block.parentNode, ctx.subAgentArea, "块出生在活动区（父流并行面——不占 messages）")
  assert.equal(ctx.messagesEl.children.length, 1, "messages 只有父块")
  feedText(block, "working…")

  // 父续段：内容进父气泡（块内 append——不影响区中块）+ 父新块 append（流尾）
  bubble.textContent += "more parent text"
  assert.equal(block.parentNode, ctx.subAgentArea, "父块内容 append（块内）不移动子块")
  const parent2 = addMessage(ctx, "assistant", "parent2")
  assert.equal(block.parentNode, ctx.subAgentArea, "父新块 append 后子块仍在活动区")
  assert.equal(ctx.messagesEl.children.length, 2, "messages = 父块 ×2")

  // sync 子代理终态（父回合内）→ freeze 落 #messages 当前尾（尾推——非出生位）
  freezeBlock(block, "done")
  assert.equal(block.parentNode, ctx.messagesEl, "冻结移入 #messages")
  assert.equal(idxOf(block), 2, "落流 = 当前尾（parent2 后——尾推 append 语义）")
  assert.equal(block.previousElementSibling, parent2, "前序 = 冻结时的流尾元素")
  assert.ok(block.nextElementSibling?.classList.contains("sub-report-preview"), "preview 落流紧跟")
})

// ─── ⑤ resetActivity（AC——live 清区 + frozen 流内保留 + 孤儿清）─────────────

test("⑤ resetActivity：live 块从活动区移除 + frozen 块 #messages 保留 + map 外孤儿 live 清（frozen 不动）", async () => {
  const { S, ctx, ensureBlock, freezeBlock, resetActivity } = await loadWebview()
  fresh({ S, ctx })
  const live = ensureBlock("sub:explore#1")
  const frozen = ensureBlock("sub:eng-coder#2")
  feedText(frozen, "done report")
  freezeBlock(frozen, "done") // 冻结 → 已落流 #messages
  assert.equal(frozen.parentNode, ctx.messagesEl, "frozen 已入流")
  // map 外孤儿 live 块（防御清路径——放活动区模拟残留）
  const orphan = document.createElement("details")
  orphan.className = "advisor-block sub-block sub-live"
  orphan.innerHTML = "<summary>orphan</summary><div class='advisor-content'></div>"
  ctx.subAgentArea.appendChild(orphan)
  // map 外孤儿 frozen（无 sub-live——不该动——放 #messages）
  const strayFrozen = document.createElement("details")
  strayFrozen.className = "advisor-block sub-block sub-frozen"
  strayFrozen.innerHTML = "<summary>stray</summary><div class='advisor-content'></div>"
  ctx.messagesEl.appendChild(strayFrozen)

  resetActivity()

  assert.equal(live.isConnected, false, "live 块从活动区移除")
  assert.equal(orphan.isConnected, false, "孤儿 live 块被防御清")
  assert.equal(S._subBlocks.size, 0, "map 清空")
  assert.equal(ctx.subAgentArea.children.length, 0, "活动区清空")
  assert.equal(ctx.subAgentArea.style.display, "none", "区空隐藏（⑨）")
  assert.equal(frozen.isConnected, true, "frozen 块保留（#messages）")
  assert.equal(strayFrozen.isConnected, true, "map 外 frozen 不动（非 live 面）")
  // frozen 本身未被移动（其前序 = m0？——messages 空——frozen 为流首）：
  assert.ok(frozen.nextElementSibling?.classList.contains("sub-report-preview"), "frozen preview 保留且紧跟")
  assert.equal(frozen.nextElementSibling.nextElementSibling, strayFrozen, "preview 后序不变（无重排）")
})

// ─── ⑥ trimOldMessages 150 窗口（AC-5——150 只数冻结——live 区外不占位）──────

test("⑥ trimOldMessages 150 窗口：冻结块占位计数——live 活动区块不计（AC-5）——超窗裁最旧消息不裁冻结", async () => {
  const { S, ctx, ensureBlock, freezeBlock, trimOldMessages } = await loadWebview()
  fresh({ S, ctx })
  // 148 条消息先行（冻结块落流晚于消息——真实流序）
  for (let i = 0; i < 148; i++) addMessage(ctx, "user", "m" + i)
  const live = ensureBlock("sub:eng-coder#2") // 活动区——不占 #messages 窗
  const frozen = ensureBlock("sub:explore#3")
  feedText(frozen, "done report")
  freezeBlock(frozen, "done") // 冻结 + preview（.sub-report-preview 非计数元素）——落流
  assert.equal(live.parentNode, ctx.subAgentArea, "live 在区")
  assert.equal(frozen.parentNode, ctx.messagesEl, "冻结在流")
  const filterCount = () => [...ctx.messagesEl.children].filter((el) =>
    el.classList.contains("message") || el.classList.contains("tool-call") || el.classList.contains("advisor-block")).length
  // 148 消息 + 冻结 = 149 计数元素（live 区外不计——150 只数冻结——AC-5）
  assert.equal(filterCount(), 149, "149 计数元素（148 消息 + 冻结——live 不计）")
  addMessage(ctx, "user", "m148") // → 150 满窗：不裁
  trimOldMessages(ctx)
  assert.equal(filterCount(), 150, "恰好 150 → 不裁")
  assert.equal(frozen.isConnected, true, "冻结块在位")
  assert.equal(live.isConnected, true, "live 块在位（区）")

  // 超窗 1 → 裁 1（最旧消息）——冻结占位计数锁定（若冻结不计数此处裁 2）
  addMessage(ctx, "user", "overflow")
  trimOldMessages(ctx)
  assert.equal(filterCount(), 150, "超窗 1 → 裁 1（冻结占位——只裁最旧消息）")
  assert.ok(![...ctx.messagesEl.children].some((el) => el.dataset.tag === "m0"), "最旧消息被裁")
  assert.equal(frozen.isConnected, true, "冻结块不裁（非最旧）")
  assert.equal(live.isConnected, true, "live 块不裁（区外——150 无涉）")
  const tags = [...ctx.messagesEl.children].map((el) => el.dataset.tag).filter(Boolean)
  assert.equal(tags.length, 149, "消息面 149（148 旧 + overflow——m0 已裁）")
})

// ─── ⑦ ⏹ 可见性规则（运行 + pool + FAMILY；区内容器；queued 等待头挂取消 ⏹ F-2）────

test("⑦ ⏹ 可见性：running+pool+FAMILY → 按钮（区内 live 块）；queued 等待头 → 取消 ⏹（F-2）；sync（pool:false）/consult/escalate-queued/冻结 → 无", async () => {
  const { S, ctx, ensureBlock, applySubagentStatus } = await loadWebview()
  fresh({ S, ctx })
  // 池条目 started → 建块 + refreshBlock 装 ⏹（applySubagentStatus 驱动）
  applySubagentStatus({ type: "subagent", status: "started", role: "eng-coder", id: 1, pool: true })
  const b1 = S._subBlocks.get("sub:eng-coder#1")
  assert.ok(b1?.querySelector(".sub-stop-btn"), "running+pool+FAMILY → ⏹ 在位")
  assert.equal(b1.parentNode, ctx.subAgentArea, "块在活动区（⏹ 委托绑区容器——chat.js）")
  // 重复 started（refreshBlock 幂等驱动）→ 不重装
  applySubagentStatus({ type: "subagent", status: "started", role: "eng-coder", id: 1, pool: true })
  assert.equal(b1.querySelectorAll(".sub-stop-btn").length, 1, "重复 started → 恰一 ⏹（幂等）")

  // sync spawn（pool:false——块经 chunk 建）→ 无 ⏹
  const b2 = ensureBlock("sub:explore#2")
  applySubagentStatus({ type: "subagent", status: "started", role: "explore", id: 2, pool: false })
  assert.ok(!b2.querySelector(".sub-stop-btn"), "sync（pool:false）无 ⏹")

  // consult（非 FAMILY——key 嵌模型）→ 无 ⏹
  const b3 = ensureBlock("sub:consult glm-5.2 #4")
  applySubagentStatus({ type: "subagent", status: "started", role: "consult", id: 4, model: "glm-5.2", sessionId: 4, pool: true })
  assert.ok(!b3.querySelector(".sub-stop-btn"), "consult 无 ⏹（FAMILY 外）")

  // queued 等待块头（⑬/F-2 面）→ 挂取消 ⏹（可撤销排队决策——QUEUED-VISIBILITY F-2——
  // 用户新裁覆盖 F-6 旧“接受无取消”）
  applySubagentStatus({ type: "subagent", status: "queued", role: "plan", id: 5, position: 1 })
  const bq = S._subBlocks.get("sub:plan#5")
  assert.ok(bq, "queued 建等待块头")
  const qbtn = bq.querySelector(".sub-stop-btn")
  assert.ok(qbtn, "queued/waiting 块头挂取消 ⏹（F-2——用户可撤销排队决策）")
  assert.equal(qbtn.title, "cancel queue", "queued ⏹ 标签 = cancel queue（running 停区分——en fixture 词——逐字定稿）")
  // 非 family 角色（escalate——generic 排队头）→ 不挂 ⏹（⏹ 角色面 = cancelable family）
  applySubagentStatus({ type: "subagent", status: "queued", role: "escalate", id: 6, position: 3 })
  const be = S._subBlocks.get("sub:escalate#6")
  assert.ok(be, "escalate 排队亦建头（generic 形态）")
  assert.ok(!be.querySelector(".sub-stop-btn"), "非 family（escalate）排队头不挂 ⏹（角色门控面不变）")

  // settle 收起 ⏹（非 running）；冻结后无
  applySubagentStatus({ type: "subagent", status: "settled", role: "eng-coder", id: 1 })
  assert.ok(!b1.querySelector(".sub-stop-btn"), "settle（非 running）⏹ 收起")
  applySubagentStatus({ type: "subagent", status: "done", role: "eng-coder", id: 1 })
  assert.ok(!b1.querySelector(".sub-stop-btn"), "冻结后无 ⏹")
  assert.ok(b1.classList.contains("sub-frozen"), "终态冻结")
})

// ─── ⑧ parseChannel/blockNamesFor 两形态（频道解析轻量面）──────────────────

test("⑧ parseChannel/blockNamesFor：family（sub:role#id）与 consult（sub:consult <model> #N）两形态 + 未知名", async () => {
  const { S, parseChannel, blockNamesFor } = await loadWebview()
  const f = parseChannel("sub:eng-coder#1")
  assert.deepEqual(f, { channel: "sub:eng-coder#1", label: "eng-coder#1", role: "eng-coder", id: 1, model: null }, "family 形态")
  const c = parseChannel("sub:consult glm-5.2 #4")
  assert.deepEqual(c, { channel: "sub:consult glm-5.2 #4", label: "consult glm-5.2 #4", role: "consult", id: 4, model: "glm-5.2" }, "consult 形态（model 段 + 数字 id）")
  assert.equal(parseChannel("garbage").role, null, "未知名 → 空形态")

  // blockNamesFor：family 前缀/后缀扫描；consult 精确键
  for (const n of ["sub:eng-coder#1", "sub:eng-coder#11", "sub:explore#1", "sub:consult glm-5.2 #4", "sub:consult glm-5.2 #7"]) {
    const blk = document.createElement("details")
    blk.innerHTML = "<summary>x</summary>"
    blk._subMeta = {}
    S._subBlocks.set(n, blk)
  }
  assert.deepEqual(blockNamesFor("eng-coder", 1, null, null), ["sub:eng-coder#1"], "family 精确后缀（#1 ≠ #11）")
  assert.deepEqual(blockNamesFor("consult", null, "glm-5.2", "4"), ["sub:consult glm-5.2 #4"], "consult 键（model+sessionId）")
  assert.deepEqual(blockNamesFor("consult", null, "glm-5.2", "7"), ["sub:consult glm-5.2 #7"], "consult 键另一 id")
  assert.deepEqual(blockNamesFor("explore", 1, null, null), ["sub:explore#1"], "explore 前缀不吞 eng-coder")
  assert.deepEqual(blockNamesFor("coder", 1, null, null), [], "无匹配 → 空")
  S._subBlocks.clear()
})

// ─── ⑨ 区空隐藏（AC-1/AC-2——updateAreaVisibility 驱动 + 空即零高）──────────

test("⑨ 活动区空隐藏：无块 → display none（零高）——块生 → 显——末块离区 → 复隐（AC-1/AC-2）", async () => {
  const { S, ctx, ensureBlock, freezeBlock } = await loadWebview()
  fresh({ S, ctx })
  const area = ctx.subAgentArea
  assert.equal(area.style.display, "none", "空区隐藏（fresh 起点——无块零高不占 grid 行）")
  assert.equal(area.children.length, 0, "空区无子元素")

  const b1 = ensureBlock("sub:eng-coder#1")
  assert.equal(area.style.display, "", "块生 → 区显")
  const b2 = ensureBlock("sub:explore#2")
  assert.equal(area.children.length, 2, "多块堆叠区中")

  // 冻结逐块离区——最后一块离区后区复隐
  freezeBlock(b2, "done")
  assert.equal(area.style.display, "", "仍有一块 → 显")
  feedText(b1, "report")
  freezeBlock(b1, "done")
  assert.equal(area.children.length, 0, "末块离区")
  assert.equal(area.style.display, "none", "末块离区 → 复隐（空区零高）")

  // 新一轮块 → 再显（reset 后生命周期重启）
  const b3 = ensureBlock("sub:plan#3")
  assert.equal(area.style.display, "", "新区块 → 区再显")
  assert.equal(b3.parentNode, area)
})

// ─── ⑩ 区自适应 + 封顶自滚（AC-2——结构性锁：grid auto 行 + 32vh 封顶 + 自滚）──

test("⑩ 活动区自适应/封顶自滚：grid auto 行 + max-height 32vh 封顶 + 区内自滚（AC-2 结构锁）", async () => {
  const { S, ctx, ensureBlock } = await loadWebview()
  fresh({ S, ctx })
  // DOM 侧：多块在区内堆叠（自适应增长面——区为容器行）
  for (const n of ["sub:explore#1", "sub:explore#2", "sub:explore#3", "sub:eng-coder#4"]) ensureBlock(n)
  assert.equal(ctx.subAgentArea.children.length, 4, "多块堆叠同一区内（区高自适应块内容）")

  // 源侧：base.css grid 行模板含活动区 auto 行（messages 1fr 后）+ 封顶/自滚规则
  const base = readFileSync(fileURLToPath(new URL("../webview/base.css", import.meta.url)), "utf8")
  assert.ok(/grid-template-rows:\s*auto minmax\(0,\s*1fr\) auto auto auto/.test(base), "grid 五行：session-bar/messages(1fr)/活动区(auto)/panels(auto)/toolbar(auto)")
  // 规则定位（indexOf 首命中在 grid 注释——规则本体以声明符起始）
  const areaRule = base.slice(base.indexOf("#subagent-activity {"))
  assert.ok(areaRule.startsWith("#subagent-activity {"), "活动区样式规则在位")
  assert.ok(areaRule.includes("max-height: 32vh"), "32vh 封顶（webview 可视约束——CLI 终端可挤 webview 不能）")
  assert.ok(areaRule.includes("overflow-y: auto"), "区级自滚（多块超封顶滚动）")
  assert.ok(areaRule.includes("#subagent-activity:empty { display: none; }"), ":empty 空区隐藏（CSS 兜底——零高不占行）")

  // 源侧：index.html 容器位于 #messages 与 #panels 之间（F-1 用户裁贴位）
  const html = readFileSync(fileURLToPath(new URL("../webview/index.html", import.meta.url)), "utf8")
  const iMessages = html.indexOf('id="messages"')
  const iArea = html.indexOf('id="subagent-activity"')
  const iPanels = html.indexOf('id="panels"')
  assert.ok(iMessages > 0 && iArea > iMessages && iPanels > iArea, "#messages < #subagent-activity < #panels（区内块样式复用 .advisor-block——chat.css 原样）")
})

// ─── ⑪ 多 settled 同锚降序冻结序（AC-4——相对序 = settle 序——任意到达序）────

test("⑪ 多 settled 同锚：done 到达序任意——冻结相对序恒 = settle 序（后 settle 插前组后——AC-4）", async () => {
  const { S, ctx, applySubagentStatus, freezeBlock } = await loadWebview()
  // 场景 A：digest 补发 done = settle 序升序（reclaim 快照序——自然序）
  fresh({ S, ctx })
  const m1 = addMessage(ctx, "user", "m1")
  applySubagentStatus({ type: "subagent", status: "started", role: "explore", id: 7, pool: true })
  const b7 = S._subBlocks.get("sub:explore#7")
  feedText(b7, "report A\nline1")
  applySubagentStatus({ type: "subagent", status: "started", role: "explore", id: 8, pool: true })
  const b8 = S._subBlocks.get("sub:explore#8")
  feedText(b8, "report B\nline1")
  applySubagentStatus({ type: "subagent", status: "settled", role: "explore", id: 7 }) // settle 先
  applySubagentStatus({ type: "subagent", status: "settled", role: "explore", id: 8 }) // settle 后
  assert.equal(b7._subMeta._freezeAtEl, m1, "两块同锚（settle 时流尾 = m1）")
  assert.equal(b8._subMeta._freezeAtEl, m1, "同锚")
  assert.ok(b7._subMeta.settleSeq < b8._subMeta.settleSeq, "settle 序单调（7 先 8 后）")

  // reclaim 升序补发 done：7 先冻 → 8 后冻——相对序 = settle 序（7 在 8 前）
  applySubagentStatus({ type: "subagent", status: "done", role: "explore", id: 7 })
  applySubagentStatus({ type: "subagent", status: "done", role: "explore", id: 8 })
  assert.equal(b7.parentNode, ctx.messagesEl, "7 落流")
  assert.equal(b8.parentNode, ctx.messagesEl, "8 落流")
  assert.ok(idxOf(b7) < idxOf(b8), "同锚落流序 = settle 序（7 先 8 后——settle 早者前）")
  assert.equal(b7.previousElementSibling, m1, "组首贴锚")
  assert.equal(b8.previousElementSibling?.classList?.contains("sub-report-preview"), true, "8 跟在 7 的 preview 后（组连续——digest 报告位置被让出）")

  // 场景 B：到达序反转（会话退出批 freezeSettledBlocks 按 settleSeq 排序面 + 任意序冻结）——
  // 同锚相对序仍 = settle 序（插入点 walk 面）
  fresh({ S, ctx })
  addMessage(ctx, "user", "x1")
  applySubagentStatus({ type: "subagent", status: "started", role: "explore", id: 17, pool: true })
  const b17 = S._subBlocks.get("sub:explore#17")
  feedText(b17, "r17")
  applySubagentStatus({ type: "subagent", status: "started", role: "explore", id: 18, pool: true })
  const b18 = S._subBlocks.get("sub:explore#18")
  feedText(b18, "r18")
  applySubagentStatus({ type: "subagent", status: "settled", role: "explore", id: 17 })
  applySubagentStatus({ type: "subagent", status: "settled", role: "explore", id: 18 })
  freezeBlock(b18, "done") // 反序冻结：后 settle 先冻
  freezeBlock(b17, "done")
  assert.ok(idxOf(b17) < idxOf(b18), "反到达序下相对序仍 = settle 序（17 先 18 后）")
})

// ─── ⑫ _freezeAtEl 被裁尾推退化（AC-4——150 裁锚 → appendChild 尾推）────────

test("⑫ settled 锚被 150 裁（isConnected=false）→ done 冻结尾推退化（AC-4）", async () => {
  const { S, ctx, applySubagentStatus, trimOldMessages } = await loadWebview()
  fresh({ S, ctx })
  // 150 条消息（m0..m149）——settle 锚 = m149（流尾）
  for (let i = 0; i < 150; i++) addMessage(ctx, "user", "m" + i)
  applySubagentStatus({ type: "subagent", status: "started", role: "explore", id: 7, pool: true })
  const block = S._subBlocks.get("sub:explore#7")
  feedText(block, "report tail")
  applySubagentStatus({ type: "subagent", status: "settled", role: "explore", id: 7 })
  const anchor = block._subMeta._freezeAtEl
  assert.equal(anchor, [...ctx.messagesEl.children][149], "锚 = settle 时流尾（m149）")

  // 后续会话内容 append 150 条 → 超窗 300 → trim 裁最旧 150（m0..m149——锚在列）
  for (let i = 150; i < 300; i++) addMessage(ctx, "user", "m" + i)
  trimOldMessages(ctx)
  assert.equal(anchor.isConnected, false, "锚被 150 裁（isConnected=false）")
  const remaining = [...ctx.messagesEl.children].filter((el) => el.classList.contains("message"))
  assert.equal(remaining.length, 150, "裁剪后余 150 消息（m150..m299）")

  // done → 锚已裁 → 尾推退化（append 到流尾——不丢冻结块）
  applySubagentStatus({ type: "subagent", status: "done", role: "explore", id: 7 })
  assert.equal(block.parentNode, ctx.messagesEl, "冻结落流")
  assert.equal(idxOf(block), 150, "尾推退化：落 #messages 当前尾（150 消息后）")
  assert.equal(block.previousElementSibling?.dataset?.tag, "m299", "前序 = 流尾消息")
  assert.ok(block.nextElementSibling?.classList.contains("sub-report-preview"), "preview 紧随")
})

// ─── ⑬ queued 等待块头（D-4——AC-3——区内等待块 + 状态词 + 取消 ⏹ F-2）──────────

test("⑬ queued/waiting 区内等待块头：queued 即建头（position/waiting 状态词 + 取消 ⏹）——started 转 running（⏹ 换停标签）——queued 取消移除（位置前移刷新）", async () => {
  const { S, ctx, applySubagentStatus } = await loadWebview()
  fresh({ S, ctx })
  const area = ctx.subAgentArea

  // queued（slot 等位）→ 区内等待块头 + 取消 ⏹（F-2——QUEUED-VISIBILITY）
  applySubagentStatus({ type: "subagent", status: "queued", role: "eng-coder", id: 9, position: 2 })
  const b9 = S._subBlocks.get("sub:eng-coder#9")
  assert.ok(b9, "queued 即建块（旧早退无块——D-4 改为建头）")
  assert.equal(b9.parentNode, area, "等待块头在活动区")
  const h9 = b9.querySelector(".sub-hdr").textContent
  assert.ok(h9.includes("⏳"), "等待块头 ⏳ 标（未启动——非 running ▶）")
  assert.ok(h9.includes("queued") && h9.includes("position 2"), "等待状态词：queued · position 2")
  const stop9 = b9.querySelector(".sub-stop-btn")
  assert.ok(stop9, "等待块头挂取消 ⏹（F-2——用户可撤销排队决策——覆盖 F-6 旧定论）")
  assert.equal(stop9.dataset.subId, "9", "⏹ 携 id（cancelSubagent 路由锚）")
  assert.equal(stop9.dataset.subRole, "eng-coder", "⏹ 携 role（角色交叉校验）")
  assert.equal(stop9.title, "cancel queue", "queued ⏹ 标签 = cancel queue（running 停区分——i18n 键）")
  assert.equal(area.style.display, "", "等待块头也使区显（有块即显）")

  // waiting-deps 形态（依赖/域等待——reason 标注）→ 同样挂取消 ⏹（slot/wait/depc 三态）
  applySubagentStatus({ type: "subagent", status: "queued", role: "explore", id: 10, waiting: "waiting-deps", reason: "files overlap: a/b.mjs" })
  const b10 = S._subBlocks.get("sub:explore#10")
  assert.ok(b10, "waiting 亦建头")
  assert.ok(b10.querySelector(".sub-hdr").textContent.includes("waiting"), "waiting 状态词在位")
  assert.ok(b10.querySelector(".sub-hdr").textContent.includes("files overlap"), "等待原因标注")
  const stop10 = b10.querySelector(".sub-stop-btn")
  assert.ok(stop10, "waiting 头亦挂取消 ⏹（三态一致——slot/wait/depc）")
  assert.equal(stop10.title, "cancel queue", "waiting ⏹ 标签同 cancel queue")
  assert.equal(area.children.length, 2, "两块等待头堆叠")

  // 补位启动（started——同频道）→ 头转 running：⏳/queued 词清——⏹ 换停标签（running+pool）
  applySubagentStatus({ type: "subagent", status: "started", role: "eng-coder", id: 9, pool: true, model: "glm-5.3" })
  const h9b = b9.querySelector(".sub-hdr").textContent
  assert.ok(h9b.includes("▶"), "started → running 头（▶）")
  assert.ok(!h9b.includes("queued · position"), "排队状态词清除（转 running 状态词）")
  assert.ok(h9b.includes("glm-5.3") && h9b.includes("async"), "mode/model 段在位（started 数据水合）")
  const stop9b = b9.querySelector(".sub-stop-btn")
  assert.ok(stop9b, "running+pool → ⏹ 在位（可定向停）")
  assert.equal(stop9b.title, "Stop this subagent", "running ⏹ 标签回 stop（queued→running 翻转重挂——幂等刷新）")

  // queued 取消（was:"queued"——从未启动）→ 等待块头移除（不冻结——⏹ 随块消失）
  applySubagentStatus({ type: "subagent", status: "cancelled", role: "explore", id: 10, was: "queued" })
  assert.equal(b10.isConnected, false, "queued 取消 → 等待块头移除")
  assert.ok(!S._subBlocks.has("sub:explore#10"), "map 同步清")
  assert.equal(area.children.length, 1, "区中剩 running 块")
  assert.ok(b9.isConnected, "running 块不受影响")

  // 出队后位置前移（refreshQueuedRows 重放——取消释放 → 后续等待头位置刷新覆盖式更新）
  applySubagentStatus({ type: "subagent", status: "queued", role: "plan", id: 11, position: 1 })
  const b11 = S._subBlocks.get("sub:plan#11")
  assert.ok(b11.querySelector(".sub-hdr").textContent.includes("position 1"), "后续排队头 position 1（出队前移生效面）")
  applySubagentStatus({ type: "subagent", status: "queued", role: "plan", id: 11, position: 1 })
  assert.ok(b11.querySelector(".sub-stop-btn"), "刷新后 ⏹ 仍在（幂等重挂不重复）")
  assert.equal(b11.querySelectorAll(".sub-stop-btn").length, 1, "重复 queued 刷新 → 恰一 ⏹")
})

// ─── ⑭ consult answered 无块防御（评审 #3——replyPreview 行快照冻结块）──────

test("⑭ consult answered 无块防御：answered 携 replyPreview 无活动块 → 按行快照建冻结块（回复不丢）", async () => {
  const { S, ctx, applySubagentStatus, ensureBlock } = await loadWebview()
  fresh({ S, ctx })
  const reply = "reply line one\nreply line two\nreply tail three"

  // 无任何先序块/流——answered（review D10 通道）→ 防御建冻结块（快照入块 + 落流尾）
  applySubagentStatus({ type: "subagent", id: "consult-7-glm-x", role: "consult", model: "glm-x", sessionId: 7, status: "answered", replyPreview: reply })
  const snap = S._subBlocks.get("sub:consult glm-x #7")
  assert.ok(snap, "无块防御：按行快照建块")
  assert.equal(snap.parentNode, ctx.messagesEl, "快照块冻结落流（#messages）")
  assert.ok(snap.classList.contains("sub-frozen"), "防御块为冻结形态（done——非 live）")
  assert.ok(snap.querySelector(".sub-hdr").textContent.includes("✓"), "冻结头 ✓ done")
  const contentText = snap.querySelector(".advisor-content").textContent
  assert.ok(contentText.includes("reply line one") && contentText.includes("reply tail three"), "块内容 = replyPreview 行快照（回复可见性承载）")
  assert.ok(snap.nextElementSibling?.classList.contains("sub-report-preview"), "冻结 preview 紧随（≤8 行镜像）")
  assert.ok(snap.nextElementSibling.textContent.includes("reply line one"), "preview 内容 = 回复头行")

  // 已有 live 块的正常路径：answered 冻结既有块——不产生重复块
  fresh({ S, ctx })
  const b = ensureBlock("sub:consult glm-y #9")
  feedText(b, "streamed activity")
  applySubagentStatus({ type: "subagent", id: "consult-9-glm-y", role: "consult", model: "glm-y", sessionId: 9, status: "answered", replyPreview: "final reply" })
  assert.equal(b.parentNode, ctx.messagesEl, "既有块 answered → 冻结落流")
  assert.equal(S._subBlocks.size, 1, "无重复块（防御只对无块路径）")
  assert.ok(b.querySelector(".advisor-content").textContent.includes("streamed activity"), "流内容保留（未覆盖）")
})

// ─── ⑮ #subagent-panel 零残留（评审 #3——AC-3——grep 断言）─────────────────

test("⑮ #subagent-panel 零残留：index.html/panels.js/CSS 无 subagent-panel/sub-item/consult-reply 引用（AC-3）", async () => {
  const wv = fileURLToPath(new URL("../webview", import.meta.url))
  const read = (p) => readFileSync(p, "utf8")
  const html = read(wv + "/index.html")
  assert.ok(!html.includes("subagent-panel"), "index.html 无 subagent-panel（行面板 div 已撤——#panels 只剩 goal/task）")
  assert.ok(html.includes('id="subagent-activity"'), "活动区容器在位")
  const panels = read(wv + "/panels.js")
  for (const tok of ["subagent-panel", "sub-item", "consult-reply", "renderSubagentPanel"]) {
    assert.ok(!panels.includes(tok), `panels.js 无 ${tok}（DOM 渲染面删——簿记保留）`)
  }
  const cssFiles = ["chat.css", "controls.css", "base.css"]
  for (const f of cssFiles) {
    const css = read(wv + "/" + f)
    for (const tok of ["subagent-panel", ".sub-item", "consult-reply", "#sub-badge"]) {
      assert.ok(!css.includes(tok), `${f} 无 ${tok}（死规则清）`)
    }
  }
  const statusBar = read(wv + "/status-bar.js")
  assert.ok(!statusBar.includes("sub-badge"), "status-bar.js 无 sub-badge（评审 #2——#subagent-panel 撤后 badge 点击 null 崩——徽标撤）")
})

// ─── ⑯ F-3 Reload 冷启快照重放消费面（AC-3——QUEUED-VISIBILITY）──────────────

test("⑯ F-3 reload 快照重放（webview 消费面）：冷启后 queued/running 行按到达序重放 → 等待块头 + running 块重建（位置/等待词保留——重复重放幂等）", async () => {
  const { S, ctx, applySubagentStatus } = await loadWebview()
  fresh({ S, ctx })
  const area = ctx.subAgentArea

  // webview reload = DOM 冷启（fresh 后区空）——extension webviewReady 响应重放 live
  // 池行（快照 = 现有消息形状重放——非新消息类型——此处逐条重放 = postPoolSnapshot 载荷）
  applySubagentStatus({ type: "subagent", status: "queued", role: "explore", id: 21, position: 1 })
  applySubagentStatus({ type: "subagent", status: "started", role: "eng-coder", id: 20, pool: true, startedAt: Date.now() - 5000, model: "glm-5.3" })
  applySubagentStatus({ type: "subagent", status: "queued", role: "plan", id: 22, waiting: "waiting-deps", reason: "files overlap: x/y.mjs" })

  assert.equal(area.children.length, 3, "三块重建（双等待头 + running 块——活动区）")
  const b21 = S._subBlocks.get("sub:explore#21")
  const b22 = S._subBlocks.get("sub:plan#22")
  const b20 = S._subBlocks.get("sub:eng-coder#20")
  assert.ok(b21 && b22 && b20, "重放建块（map 登记）")
  const h21 = b21.querySelector(".sub-hdr").textContent
  assert.ok(h21.includes("⏳") && h21.includes("queued · position 1"), "等待头重建——位置保留（AC-3）")
  assert.equal(b21.querySelector(".sub-stop-btn")?.title, "cancel queue", "等待头重建——取消 ⏹ 随行（F-2 面）")
  const h22 = b22.querySelector(".sub-hdr").textContent
  assert.ok(h22.includes("waiting") && h22.includes("x/y.mjs"), "waiting 头重建——等待词/原因保留")
  assert.ok(b22.querySelector(".sub-stop-btn"), "waiting 头重建——取消 ⏹ 随行")
  const h20 = b20.querySelector(".sub-hdr").textContent
  assert.ok(h20.includes("▶") && h20.includes("glm-5.3"), "running 块重建（started 形重放——数据水合）")
  assert.equal(b20.querySelector(".sub-stop-btn")?.title, "Stop this subagent", "running ⏹ 停标签（重建面）")
  assert.equal(area.style.display, "", "重建后区显")

  // 队列推进（出队后位置刷新重放）→ 覆盖式更新（幂等——不重复建块）
  applySubagentStatus({ type: "subagent", status: "queued", role: "plan", id: 22, position: 1 })
  assert.equal(area.children.length, 3, "重复重放不重复建块（覆盖式更新）")
  assert.ok(b22.querySelector(".sub-hdr").textContent.includes("position 1"), "位置前移覆盖式更新")
})

// ─── ⑱ F-4 i18n 词（AC-4——QUEUED-VISIBILITY）──────────────────────────────

test("⑱ F-4 i18n：zh 覆盖下 waiting 词/位置段/取消 ⏹ 标签中文——en fixture 词不回归", async () => {
  const { S, ctx, applySubagentStatus } = await loadWebview()
  fresh({ S, ctx })
  const { setStrings } = await import("../webview/i18n.js")
  const readL = (f) => JSON.parse(readFileSync(fileURLToPath(new URL(`../locales/${f}`, import.meta.url)), "utf8"))
  const zh = readL("zh.json")
  try {
    setStrings(zh)
    // queued slot 等位：排队中 · 位置 N（词段走 i18n——逐字定稿）
    applySubagentStatus({ type: "subagent", status: "queued", role: "eng-coder", id: 31, position: 2 })
    const b31 = S._subBlocks.get("sub:eng-coder#31")
    const h31 = b31.querySelector(".sub-hdr").textContent
    assert.ok(h31.includes("排队中") && h31.includes("位置 2"), "zh 位置段：排队中 · 位置 2")
    assert.equal(b31.querySelector(".sub-stop-btn")?.title, "取消排队", "zh 取消 ⏹ 标签键")
    // waiting：等待中 — reason
    applySubagentStatus({ type: "subagent", status: "queued", role: "explore", id: 32, waiting: "waiting-deps", reason: "域冲突 z.mjs" })
    const h32 = S._subBlocks.get("sub:explore#32").querySelector(".sub-hdr").textContent
    assert.ok(h32.includes("等待中"), "zh waiting 词：等待中 — reason")
    assert.ok(h32.includes("域冲突 z.mjs"), "reason 原样随行")
    // running ⏹ zh 停标签（frozen 词不回归面）
    applySubagentStatus({ type: "subagent", status: "started", role: "eng-coder", id: 31, pool: true })
    assert.equal(b31.querySelector(".sub-stop-btn")?.title, "停止该子代理", "zh running ⏹ 停标签")
  } finally {
    setStrings(readL("en.json")) // 还原 fixture 注入（同文件后测零串扰）
  }
  // en fixture 词不回归（还原后即时断言——⑬/⑯ 已锁 en 词形——此处补跑状态词切换面）
  applySubagentStatus({ type: "subagent", status: "queued", role: "coder", id: 33, position: 1 })
  const h33 = S._subBlocks.get("sub:coder#33").querySelector(".sub-hdr").textContent
  assert.ok(h33.includes("queued") && h33.includes("position 1"), "en 词回位（zh 切换不残留）")
})

