/**
 * activity-flow.test.mjs — SESSION-FLOW-B B1 测试（子代理块流内出生 · 原地冻结）。
 * docs/design/SESSION-FLOW-B.md B1 节（F-B1a~f + N3 无 DOM move 不变式——AC-B1a~f 组）。
 *
 * 手法（webview 侧 happy-dom——webview-turnstate.test.mjs 模式）：setupWebview +
 * installChatFixture 后动态 import 真模块（state.js/ui.js/activity.js——单一运行时对象
 * S/ctx），直接驱动 activity 导出（ensureBlock/applySubagentStatus/freezeBlock/
 * resetActivity/parseChannel/blockNamesFor）与 ui.appendAdvisorChunk（块内容行——
 * appendPreview 的 text 行来源）。不引导 chat.js/panels.js 全量模块图（panels.js 2s
 * interval 不 import 无悬挂）。ticker seam：setActivityTickDisabled(true)——无真实
 * interval（假时钟 activityTick 手动驱动——本组不测 elapsed 漂移）。
 * 快层直跑（全部 <800ms——无真实定时器）。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
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

/** 逐测冷启复位（node --test 同文件串行——模块缓存共享同一 S/ctx——每测独立起点）。 */
function fresh({ S, ctx }) {
  ctx.messagesEl.replaceChildren()
  S._subBlocks.clear()
  S._subagentMap = {}
  ctx._pinBottom = undefined
}

/** 直接子元素序号（无 DOM move 断言用——位置 == 出生位）。 */
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

// ─── ① 出生 #messages 流尾 + 钉底（AC-B1b——F-B1b 落点 A）──────────────

test("① live 块出生即在 #messages 流尾（与 .message 兄弟序）+ 出生钉底（maybeScrollDown）", async () => {
  const { S, ctx, ensureBlock } = await loadWebview()
  fresh({ S, ctx })
  const m1 = addMessage(ctx, "user", "m1")
  const m2 = addMessage(ctx, "assistant", "m2")

  ctx.messagesEl.scrollTop = 0
  const block = ensureBlock("sub:eng-coder#1")

  assert.equal(block.parentNode, ctx.messagesEl, "块直接挂在 #messages（流级——非嵌入父段）")
  assert.equal(block, ctx.messagesEl.lastElementChild, "出生位 = 当前流尾")
  assert.equal(block.previousElementSibling, m2, "与既有 .message 兄弟序（m1 < m2 < block）")
  assert.equal(idxOf(block), 2, "序号 = 流尾序号（直接子元素计数面——F-B1e）")
  assert.ok(block.classList.contains("advisor-block") && block.classList.contains("sub-block") && block.classList.contains("sub-live"), "块类：advisor-block（150 计数同规则）+ sub-block + sub-live")
  assert.equal(S._subBlocks.size, 1, "map 登记")
  assert.equal(ctx.messagesEl.scrollTop, Number.MAX_SAFE_INTEGER, "出生即钉底（maybeScrollDown——R22 面板 scrollTop 的流内替代）")
  // 上读（pinBottom=false）时出生不强拉
  ctx.messagesEl.scrollTop = 0
  ctx._pinBottom = false
  ensureBlock("sub:eng-coder#2")
  assert.equal(ctx.messagesEl.scrollTop, 0, "用户上读中出生不抢滚动（pinBottom 语义）")
})

// ─── ② freeze 原地（AC-B1c——F-B1c 全链 settle→digest done + 终态形态）────

test("② freeze 原地：settle→done 全链——parentNode/前序不变、头翻 ✓ done、preview 紧跟块；error 有 preview；stopped 无", async () => {
  const { S, ctx, applySubagentStatus } = await loadWebview()
  fresh({ S, ctx })
  const m1 = addMessage(ctx, "user", "m1")
  // started（池条目——started 建块即 refreshBlock——⏹ 面见 ⑦）
  applySubagentStatus({ type: "subagent", status: "started", role: "eng-coder", id: 1, pool: true, model: "glm-5.3", maxTurns: 100, turn: 1 })
  const block = S._subBlocks.get("sub:eng-coder#1")
  assert.ok(block, "started 建块")
  const birthIdx = idxOf(block)
  assert.equal(block.previousElementSibling, m1)
  feedText(block, "report line 1\nreport line 2")

  // settle → 只翻状态（原地——还在出生位）
  applySubagentStatus({ type: "subagent", status: "settled", role: "eng-coder", id: 1 })
  assert.equal(idxOf(block), birthIdx, "settle 后位置不变")
  const settledHdr = block.querySelector(".sub-hdr").textContent
  assert.ok(settledHdr.includes("✓"), "settle 头翻 ✓")
  assert.ok(settledHdr.includes("awaiting digestion"), "settle 显示 done · awaiting digestion（流内驻留）")

  // digest done → 原地冻结
  applySubagentStatus({ type: "subagent", status: "done", role: "eng-coder", id: 1, turn: 4 })
  assert.equal(block.parentNode, ctx.messagesEl, "冻结后 parentNode 不变")
  assert.equal(block.previousElementSibling, m1, "冻结后前序元素不变（无 DOM move）")
  assert.equal(idxOf(block), birthIdx, "块位置 == 出生位（回归红线）")
  assert.ok(block.classList.contains("sub-frozen") && !block.classList.contains("sub-live"), "class 换 sub-live → sub-frozen")
  assert.equal(block.open, false, "冻结折叠")
  assert.ok(!block.querySelector(".sub-stop-btn"), "⏹ 移除")
  const frozenHdr = block.querySelector(".sub-hdr").textContent
  assert.ok(frozenHdr.includes("✓") && frozenHdr.includes("done"), "冻结头 ✓ done")
  assert.ok(frozenHdr.includes("turn 4/100"), "终态 turn 快照延续")
  const preview = block.nextElementSibling
  assert.ok(preview?.classList.contains("sub-report-preview"), "done → preview 紧跟块（块下方）")
  assert.ok(preview.textContent.includes("report line 2"), "preview 内容 = 报告尾")

  // error 形态（另一块）：冻结 + preview 紧跟
  const { ensureBlock } = await loadWebview()
  const eblock = ensureBlock("sub:explore#2")
  feedText(eblock, "err report")
  applySubagentStatus({ type: "subagent", status: "error", role: "explore", id: 2, error: "boom" })
  assert.ok(eblock.nextElementSibling?.classList.contains("sub-report-preview"), "error → preview 紧跟块")
  const ehdr = eblock.querySelector(".sub-hdr").textContent
  assert.ok(ehdr.includes("⏹") && ehdr.includes("error"), "error 头 ⏹ error")
  assert.ok(eblock.classList.contains("sub-frozen"), "error 冻结")

  // stopped 形态（再一块）：冻结但无 preview（CLI parity）
  const sblock = ensureBlock("sub:plan#3")
  feedText(sblock, "partial work")
  applySubagentStatus({ type: "subagent", status: "cancelled", role: "plan", id: 3 })
  const snext = sblock.nextElementSibling
  assert.ok(!snext || !snext.classList.contains("sub-report-preview"), "stopped 无 preview")
  assert.ok(sblock.querySelector(".sub-hdr").textContent.includes("stopped"), "stopped 头词")
  assert.ok(sblock.classList.contains("sub-frozen"), "stopped 亦冻结")
})

// ─── ③ settled 挂起驻留 → digest done 原地冻（回归红线：无 DOM move）──────

test("③ 挂起驻留：settle 后流内驻留（awaiting digestion）——digest 报告排块后——done 冻结原地（位置 == 出生位——无 DOM move 红线）", async () => {
  const { S, ctx, applySubagentStatus } = await loadWebview()
  fresh({ S, ctx })
  addMessage(ctx, "user", "m1")
  applySubagentStatus({ type: "subagent", status: "started", role: "explore", id: 7, pool: true })
  const block = S._subBlocks.get("sub:explore#7")
  const birthIdx = idxOf(block)
  feedText(block, "settle report tail") // digest done 冻结时 appendPreview 的 report 源

  // settle（挂起期——不冻结——流内驻留出生位）
  applySubagentStatus({ type: "subagent", status: "settled", role: "explore", id: 7 })
  assert.equal(block.parentNode, ctx.messagesEl, "驻留 #messages（无移出动作）")
  assert.equal(idxOf(block), birthIdx, "settle 后块仍在出生位")
  assert.ok(block.classList.contains("sub-live") && !block.classList.contains("sub-frozen"), "settle 不冻结（仍 live）")
  assert.ok(block.querySelector(".sub-hdr").textContent.includes("awaiting digestion"), "awaiting-digestion 词在位")

  // digest 回合渲染报告（新 .message 自然排在块后）
  const report = addMessage(ctx, "assistant", "report")
  assert.equal(report.previousElementSibling, block, "digest 报告排块后（settle 到 done 之间）")
  assert.equal(idxOf(block), birthIdx, "报告 append 不移动块")

  // digest done → 原地冻结——preview 夹在块与报告之间
  applySubagentStatus({ type: "subagent", status: "done", role: "explore", id: 7 })
  assert.equal(idxOf(block), birthIdx, "冻结后位置 == 出生位（无 DOM move——AC-B1c/N3 红线）")
  assert.equal(block.previousElementSibling?.dataset?.tag, "m1", "前序元素不变")
  assert.ok(block.nextElementSibling?.classList.contains("sub-report-preview"), "preview 夹在块与 digest 报告之间")
  assert.equal(block.nextElementSibling.nextElementSibling, report, "报告仍在块后（相对序不变）")
})

// ─── ④ sync 子代理父回合中途出生（F-B1b——父续段后块仍在出生位）─────────

test("④ 同步子代理父回合中途出生：父段在时出生——父续段/父新块 append 后块仍在出生位", async () => {
  const { S, ctx, ensureBlock } = await loadWebview()
  fresh({ S, ctx })
  // 父回合进行中：父块已挂 #messages（sync spawn 无 started 建块——首 chunk 建块面）
  const parent = addMessage(ctx, "assistant", "parent1")
  const bubble = document.createElement("div")
  bubble.className = "bubble content"
  parent.appendChild(bubble)
  bubble.textContent = "parent stream…"

  const block = ensureBlock("sub:eng-coder#5") // 父块存在时出生 → 流尾 = 父块之后
  assert.equal(block.previousElementSibling, parent, "块出生在父块之后（兄弟序）")
  const birthIdx = idxOf(block)
  feedText(block, "working…")

  // 父续段：内容进父气泡（不进 messagesEl 层）+ 父新块 append（工具批边界后）
  bubble.textContent += "more parent text"
  assert.equal(idxOf(block), birthIdx, "父块内容 append（块内）不移动子块")
  const parent2 = addMessage(ctx, "assistant", "parent2")
  assert.equal(idxOf(block), birthIdx, "父新块 append 后子块仍在出生位")
  assert.equal(block.nextElementSibling, parent2, "块夹在父段之间（出生位语义——终态原地折叠）")
  assert.equal(block.previousElementSibling, parent, "前序仍 = 出生时父块")
})

// ─── ⑤ resetActivity（AC-B1d——F-B1d：live 移除 + frozen 保留 + 孤儿清）──

test("⑤ resetActivity：live 块从 #messages 移除 + frozen 块保留 + map 外孤儿 live 清（frozen 不动）", async () => {
  const { S, ctx, ensureBlock, freezeBlock, resetActivity } = await loadWebview()
  fresh({ S, ctx })
  const live = ensureBlock("sub:explore#1")
  const frozen = ensureBlock("sub:eng-coder#2")
  feedText(frozen, "done report")
  freezeBlock(frozen, "done")
  // map 外孤儿 live 块（防御清路径）
  const orphan = document.createElement("details")
  orphan.className = "advisor-block sub-block sub-live"
  orphan.innerHTML = "<summary>orphan</summary><div class='advisor-content'></div>"
  ctx.messagesEl.appendChild(orphan)
  // map 外孤儿 frozen（无 sub-live——不该动）
  const strayFrozen = document.createElement("details")
  strayFrozen.className = "advisor-block sub-block sub-frozen"
  strayFrozen.innerHTML = "<summary>stray</summary><div class='advisor-content'></div>"
  ctx.messagesEl.appendChild(strayFrozen)

  resetActivity()

  assert.equal(live.isConnected, false, "live 块从 #messages 移除")
  assert.equal(orphan.isConnected, false, "孤儿 live 块被防御清")
  assert.equal(S._subBlocks.size, 0, "map 清空")
  assert.equal(frozen.isConnected, true, "frozen 块保留")
  assert.equal(strayFrozen.isConnected, true, "map 外 frozen 不动（非 live 面）")
  // frozen 本身未被移动（前方 live 兄弟被移除——序号变化来自兄弟删除，非块重排）：
  // 其后序（preview → strayFrozen）与相对序不变
  assert.equal(idxOf(frozen), 0, "frozen 为剩余流首（自身未被重排）")
  assert.ok(frozen.nextElementSibling?.classList.contains("sub-report-preview"), "frozen preview 保留且紧跟")
  assert.equal(frozen.nextElementSibling.nextElementSibling, strayFrozen, "preview 后序不变（无重排）")
})

// ─── ⑥ trimOldMessages 计入（AC-B1e——F-B1e：live/冻结占位计数）─────────

test("⑥ trimOldMessages 150 窗口：live/冻结子块从出生即占位计数（无豁免）——满窗不裁——超窗裁最旧消息不裁块", async () => {
  const { S, ctx, ensureBlock, freezeBlock, trimOldMessages } = await loadWebview()
  fresh({ S, ctx })
  // 148 条消息先行（块出生晚于消息——真实流序：块在消息尾出生）
  for (let i = 0; i < 148; i++) addMessage(ctx, "user", "m" + i)
  const live = ensureBlock("sub:eng-coder#2")
  const frozen = ensureBlock("sub:explore#3")
  feedText(frozen, "done report")
  freezeBlock(frozen, "done") // 冻结 + preview（.sub-report-preview 非计数元素）
  assert.ok(live.classList.contains("sub-live") && frozen.classList.contains("sub-frozen"), "live + frozen 块就位")
  const filterCount = () => [...ctx.messagesEl.children].filter((el) =>
    el.classList.contains("message") || el.classList.contains("tool-call") || el.classList.contains("advisor-block")).length
  // 148 消息 + live + frozen = 150 计数元素——恰好满窗：不裁
  assert.equal(filterCount(), 150, "满窗 150（148 消息 + live + 冻结）")
  trimOldMessages(ctx)
  assert.equal(filterCount(), 150, "恰好 150 → 不裁")
  assert.equal(live.isConnected, true, "live 块在位")
  assert.equal(frozen.isConnected, true, "冻结块在位")

  // 超窗 1 → 裁 1（最旧消息）——块若豁免则此处裁 0（占位计数锁定）
  addMessage(ctx, "user", "overflow")
  trimOldMessages(ctx)
  assert.equal(filterCount(), 150, "超窗 1 → 裁 1（块占位——只裁最旧消息）")
  assert.ok(![...ctx.messagesEl.children].some((el) => el.dataset.tag === "m0"), "最旧消息被裁")
  assert.equal(live.isConnected, true, "live 块不裁（非最旧）")
  assert.equal(frozen.isConnected, true, "冻结块不裁（非最旧）")
  const tags = [...ctx.messagesEl.children].map((el) => el.dataset.tag).filter(Boolean)
  assert.equal(tags[0], "m1", "次旧消息仍在（只裁最旧 1 条）")
  assert.equal(tags.length, 148, "消息面 148（147 旧 + 1 overflow）")
})

// ─── ⑦ ⏹ 可见性规则（running + pool + FAMILY；冻结无）────────────────

test("⑦ ⏹ 可见性：running+pool+FAMILY → 按钮；sync（pool:false）/consult/冻结 → 无", async () => {
  const { S, ctx, ensureBlock, applySubagentStatus } = await loadWebview()
  fresh({ S, ctx })
  // 池条目 started → 建块 + refreshBlock 装 ⏹（applySubagentStatus 驱动）
  applySubagentStatus({ type: "subagent", status: "started", role: "eng-coder", id: 1, pool: true })
  const b1 = S._subBlocks.get("sub:eng-coder#1")
  assert.ok(b1?.querySelector(".sub-stop-btn"), "running+pool+FAMILY → ⏹ 在位")
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

  // settle 收起 ⏹（非 running）；冻结后无
  applySubagentStatus({ type: "subagent", status: "settled", role: "eng-coder", id: 1 })
  assert.ok(!b1.querySelector(".sub-stop-btn"), "settle（非 running）⏹ 收起")
  applySubagentStatus({ type: "subagent", status: "done", role: "eng-coder", id: 1 })
  assert.ok(!b1.querySelector(".sub-stop-btn"), "冻结后无 ⏹")
  assert.ok(b1.classList.contains("sub-frozen"), "终态冻结")
})

// ─── ⑧ parseChannel/blockNamesFor 两形态（频道解析轻量面）──────────────

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
