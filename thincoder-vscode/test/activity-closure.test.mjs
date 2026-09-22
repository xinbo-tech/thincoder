/**
 * activity-closure.test.mjs — 活动区收口批（2026-09-12）R1/R3/R4 机器验收。
 * 设计权威：`docs/design/WEBVIEW.md` §14（C-1..C-8 · C-11②③④ · 用例 T-CL1..T-CL8/T-CL10..T-CL13/
 * T-CL17..T-CL19 · AC-CL1/AC-CL3/AC-CL4）；批次档 `2026-09-12-VSC-ACTIVITY-CLOSURE.md` §2。
 * 手法（§14.7）：installChatFixture + 真 activity.js/activity-view.js 动态 import（activity-flow 同骨架）；
 * digest 边界面 = 手工 `.digest-turn` + `S._digestBoundary` 直驱（chat.js 真驱动的轮元素面在
 * digest-visibility.test.mjs——不重复）。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { setupWebview, installChatFixture } from "./helpers/webview-env.mjs"

let cleanupEnv
let _diag // 痕迹面（2026-09-19 批起由 activity-diag.js 持环载体）

before(() => {
  const env = setupWebview()
  cleanupEnv = env.cleanup
  installChatFixture()
})

after(() => {
  try { window.dispatchEvent(new window.Event("unload")) } catch { /* happy-dom teardown edge */ }
  cleanupEnv()
})

async function loadWebview() {
  const state = await import("../webview/state.js")
  const activity = await import("../webview/activity.js")
  const streaming = await import("../webview/streaming.js")
  const i18n = await import("../webview/i18n.js")
  _diag = await import("../webview/activity-diag.js")
  return { S: state.S, ctx: state.ctx, t: i18n.t, subagentChunk: streaming.subagentChunk, ...activity }
}

function fresh({ S, ctx }) {
  ctx.messagesEl.replaceChildren()
  ctx.activityEl.replaceChildren()
  S._subBlocks.clear()
  _diag.resetSubTrace() // 痕迹面（环载体 = activity-diag.js）
  S._digestBoundary = null
  S._subDescShown = true // A13 说明行一次性标志（该面另有专档）
}

const regionBlocks = (ctx) => [...ctx.activityEl.children].filter((el) => el.classList.contains("sub-block"))
const streamBlocks = (ctx) => [...ctx.messagesEl.children].filter((el) => el.classList.contains("sub-block"))
const hdrOf = (block) => block.querySelector(".sub-hdr").textContent
const subMsg = (status, role, id, extra = {}) => ({ type: "subagent", status, role, id, ...extra })

function addMessage(ctx, tag) {
  const el = document.createElement("div")
  el.className = "message"
  if (tag != null) el.dataset.tag = tag
  ctx.messagesEl.appendChild(el)
  return el
}

function digestBoundary(ctx, S) {
  const label = document.createElement("div")
  label.className = "digest-turn"
  ctx.messagesEl.appendChild(label)
  S._digestBoundary = label
  return label
}

function settle(applySubagentStatus, S, role, id) {
  applySubagentStatus(subMsg("started", role, id, { pool: true, model: "glm-5.3" }))
  applySubagentStatus(subMsg("settled", role, id))
  return S._subBlocks.get(`sub:${role}#${id}`)
}

// ─── AC-CL1 / AC-CL3：awaiting 驻留与三类归档 ─────────────
test("T-CL1 awaiting 驻留（AC-CL3）：settled → 块留区 + 头含 CLI 对位态词（括号去 verb）+ 回收前不归档", async () => {
  const { S, ctx, applySubagentStatus, t } = await loadWebview()
  fresh({ S, ctx })
  const block = settle(applySubagentStatus, S, "eng-coder", 4)
  assert.equal(regionBlocks(ctx).length, 1, "settled → 块留区（awaitingDigest 驻留）")
  assert.equal(streamBlocks(ctx).length, 0, "回收前不归档（#messages 零块）")
  assert.equal(block._subMeta.awaitingDigest, true, "awaitingDigest 单标志置位")
  assert.ok(block.classList.contains("sub-frozen") && block.open === false, "折叠态（两态机不变）")
  const hdr = hdrOf(block)
  assert.ok(hdr.includes(t("sub.awaitingDigest")), `块头含态词（en 逐字 ${JSON.stringify(t("sub.awaitingDigest"))}）`)
  const bracket = hdr.slice(0, hdr.indexOf("]"))
  assert.ok(!/done|stopped|error/.test(bracket), `括号去 verb（C-2——实到 ${JSON.stringify(bracket)}）`)
  assert.ok(bracket.includes("✓") && bracket.includes("eng-coder#4") && bracket.includes("async"), "头其余段保持（icon/键/模式词）")
})

test("T-CL2 回收归档（AC-CL1）：reclaim done → 块出区、落 #messages 且紧邻本轮边界之前 + 头词回终态", async () => {
  const { S, ctx, applySubagentStatus } = await loadWebview()
  fresh({ S, ctx })
  const block = settle(applySubagentStatus, S, "explore", 7)
  const boundary = digestBoundary(ctx, S)
  addMessage(ctx, "digest-text") // 本轮 digest 输出（边界之后）
  applySubagentStatus(subMsg("done", "explore", 7))
  assert.equal(block.parentNode, ctx.messagesEl, "块出区 → #messages")
  assert.equal(block.nextElementSibling, boundary, "落点 = 本轮边界之前（CLI 序：块在 digest 文本前）")
  assert.equal(block._subMeta.awaitingDigest, false, "回收后清 awaitingDigest")
  assert.ok(!hdrOf(block).includes("awaiting"), "头词回终态形态（不留悬空「等待消化」）")
  assert.ok(hdrOf(block).includes("✓") && hdrOf(block).includes("done"), "冻结头 ✓ done")
  assert.equal(regionBlocks(ctx).length, 0, "区无该块（清退）")
})

test("T-CL3 普通终态即时归档（AC-CL1）：sync done → 折叠 + 尾追（无边界依赖）", async () => {
  const { S, ctx, applySubagentStatus, ensureBlock } = await loadWebview()
  fresh({ S, ctx })
  addMessage(ctx, "m1")
  const block = ensureBlock("sub:eng-coder#5") // sync spawn 首 chunk 建块形态
  addMessage(ctx, "m2")
  applySubagentStatus(subMsg("done", "eng-coder", 5))
  assert.equal(block.parentNode, ctx.messagesEl, "即时归档（不驻区）")
  assert.equal(block, ctx.messagesEl.lastElementChild, "尾追（无边界 → appendChild）")
  assert.ok(block.classList.contains("sub-frozen"), "折叠态")
  assert.equal(regionBlocks(ctx).length, 0, "区空")
})

test("T-CL4 多块保序（AC-CL1）：同批两 reclaim → 到达序相邻（insertBefore 逐个）", async () => {
  const { S, ctx, applySubagentStatus } = await loadWebview()
  fresh({ S, ctx })
  const b1 = settle(applySubagentStatus, S, "explore", 1)
  const b2 = settle(applySubagentStatus, S, "explore", 2)
  const boundary = digestBoundary(ctx, S)
  applySubagentStatus(subMsg("done", "explore", 1))
  applySubagentStatus(subMsg("done", "explore", 2))
  assert.equal(b1.nextElementSibling, b2, "两归档块相邻（保序）")
  assert.equal(b2.nextElementSibling, boundary, "整体落边界之前")
  assert.ok(b1.compareDocumentPosition(b2) & Node.DOCUMENT_POSITION_FOLLOWING, "相对序 = 到达序")
})

test("T-CL5 会话退出 flush（AC-CL1）：freezeLiveBlocks → 区全体归档（live 折叠 + awaiting 归档，尾追）", async () => {
  const { S, ctx, applySubagentStatus, freezeLiveBlocks } = await loadWebview()
  fresh({ S, ctx })
  applySubagentStatus(subMsg("started", "explore", 1, { pool: true }))
  const live = S._subBlocks.get("sub:explore#1")
  const awaiting = settle(applySubagentStatus, S, "plan", 2)
  assert.equal(regionBlocks(ctx).length, 2, "前置：区 live + awaiting 各一")
  freezeLiveBlocks()
  assert.equal(live.parentNode, ctx.messagesEl, "live → 归档")
  assert.equal(awaiting.parentNode, ctx.messagesEl, "awaitingDigest → 归档（无悬空驻留）")
  assert.ok(live.classList.contains("sub-frozen") && awaiting.classList.contains("sub-frozen"), "两者折叠")
  assert.equal(regionBlocks(ctx).length, 0, "区清空")
  assert.equal(ctx.messagesEl.lastElementChild, awaiting, "尾追（到达/遍历序）")
  assert.equal(awaiting._subMeta.awaitingDigest, false, "归档后清标志")
  const snapshot = [...ctx.messagesEl.children]
  freezeLiveBlocks() // 幂等：已在流者不动（二次 flush 零变化）
  assert.deepEqual([...ctx.messagesEl.children], snapshot, "已在流者不动（幂等）")
})

test("T-CL6 全归档后区空（AC-CL1）：区 children 0 且 :empty 规则在位（静态）", async () => {
  const { S, ctx, applySubagentStatus } = await loadWebview()
  fresh({ S, ctx })
  applySubagentStatus(subMsg("started", "explore", 3, { pool: true }))
  applySubagentStatus(subMsg("done", "explore", 3))
  assert.equal(ctx.activityEl.children.length, 0, "末块归档 → 区 children 0")
  assert.ok(ctx.activityEl.matches(":empty"), "空区命中 :empty（隐藏规则选择器有效）")
})

test("T-CL7/T-CL8 边界失效与无边界（AC-CL1）：回合元素先被移除 / 无在轮 digest → reclaim 一律尾追（不抛错）", async () => {
  const { S, ctx, applySubagentStatus } = await loadWebview()
  fresh({ S, ctx })
  // 边界失效（150 裁/清屏）
  const block = settle(applySubagentStatus, S, "explore", 4)
  const boundary = digestBoundary(ctx, S)
  addMessage(ctx, "filler")
  boundary.remove()
  assert.doesNotThrow(() => applySubagentStatus(subMsg("done", "explore", 4)), "不抛错")
  assert.equal(block.parentNode, ctx.messagesEl)
  assert.equal(block, ctx.messagesEl.lastElementChild, "退化尾追")
  // 无边界（用户回合路径——无在轮 digest）
  const block2 = settle(applySubagentStatus, S, "eng-coder", 8)
  addMessage(ctx, "user-turn-text")
  applySubagentStatus(subMsg("done", "eng-coder", 8))
  assert.equal(block2.parentNode, ctx.messagesEl)
  assert.equal(block2, ctx.messagesEl.lastElementChild, "无边界 → appendChild 尾追")
})

// ─── AC-CL1 其余：接管吞守卫 / 补桩 / reset / 中断残块 ──────
test("T-CL10 新代接管 + 旧代回收吞（AC-CL1）：旧 awaiting 块即时归档；其后首条 done 被吞——新块不提前终止", async () => {
  const { S, ctx, applySubagentStatus } = await loadWebview()
  fresh({ S, ctx })
  const old = settle(applySubagentStatus, S, "eng-coder", 4)
  assert.equal(old._subMeta.awaitingDigest, true, "旧块 awaiting（回收在途）")
  applySubagentStatus(subMsg("started", "eng-coder", 4, { pool: true, model: "glm-5.3", startedAt: 777 }))
  const next = S._subBlocks.get("sub:eng-coder#4")
  assert.ok(next && next !== old, "新代接管（键重绑）")
  assert.equal(next._subMeta.frozen, false, "新块 live")
  assert.equal(next._subMeta.oldReclaimPending, true, "新块布防（旧代回收在途——C-5③）")
  assert.equal(old.parentNode, ctx.messagesEl, "旧 awaiting 块即时归档（C-5③）")
  assert.equal(old._subMeta.awaitingDigest, false, "旧块 awaitingDigest 清（头词回终态）")
  assert.ok(_diag.subTraceEntries().some((e) => e.kind === "takeover"), "takeover 痕迹在位")
  // 旧代回收 done 到达 → 吞：新块仍 live、不折叠、不归档
  applySubagentStatus(subMsg("done", "eng-coder", 4))
  assert.equal(next._subMeta.frozen, false, "吞守卫：新块不折叠（不失明/不提前终止）")
  assert.equal(next.parentNode, ctx.activityEl, "新块仍留区")
  assert.equal(next._subMeta.oldReclaimPending, false, "吞后清标志")
  assert.equal(next._subMeta.awaitingDigest, false, "新块未被置 awaiting")
  // 其后正常终态不再被吞
  applySubagentStatus(subMsg("done", "eng-coder", 4))
  assert.ok(next.classList.contains("sub-frozen"), "二次 done 正常冻结")
  assert.equal(next.parentNode, ctx.messagesEl, "二次 done 正常归档（尾追——无旧代在途）")
})

test("T-CL11 补桩直归档（AC-CL1）：never-born done → 桩出生即折叠 + 立即归档（流内可见）+ 痕迹", async () => {
  const { S, ctx, applySubagentStatus } = await loadWebview()
  fresh({ S, ctx })
  addMessage(ctx, "m1")
  applySubagentStatus(subMsg("done", "explore", 11))
  const stub = S._subBlocks.get("sub:explore#11")
  assert.ok(stub, "补出桩块")
  assert.equal(stub._subMeta.frozen, true, "桩 = 已折叠")
  assert.equal(stub.parentNode, ctx.messagesEl, "立即归档（流内可见——「终态必现」）")
  assert.equal(regionBlocks(ctx).length, 0, "不驻区")
  assert.ok(_diag.subTraceEntries().some((e) => e.kind === "late-terminal-stub"), "late-terminal-stub 留痕")
  // 表内不补行（answered / queued-cancel）保持 no-op（成员表语义不动）
  applySubagentStatus(subMsg("answered", "explore", 41))
  applySubagentStatus(subMsg("cancelled", "explore", 42, { was: "queued" }))
  assert.equal(S._subBlocks.size, 1, "两不补行零新块")
})

test("T-CL12 reset/清屏（AC-CL1）：resetActivity 只清区子树——流内归档块（历史）留存；clearMessages 全清", async () => {
  const { S, ctx, applySubagentStatus, resetActivity } = await loadWebview()
  fresh({ S, ctx })
  applySubagentStatus(subMsg("started", "explore", 1, { pool: true }))
  applySubagentStatus(subMsg("done", "explore", 1)) // 归档（流内历史）
  const archived = S._subBlocks.get("sub:explore#1")
  applySubagentStatus(subMsg("started", "plan", 2, { pool: true }))
  assert.equal(regionBlocks(ctx).length, 1, "前置：区一 live")
  resetActivity()
  assert.equal(regionBlocks(ctx).length, 0, "区清")
  assert.equal(S._subBlocks.size, 0, "map 清")
  assert.equal(archived.parentNode, ctx.messagesEl, "流内归档块不动（会话历史——C-7）")
  ctx.messagesEl.replaceChildren() // clearMessages（chat-messages.js case 等价：replaceChildren + resetActivity）
  resetActivity()
  assert.equal(streamBlocks(ctx).length, 0, "clearMessages 全清")
})

test("T-CL13 digest 中断残块（AC-CL1/AC-CL3）：end ok:false 无 reclaim → 残块留区；下轮回收才归档", async () => {
  const { S, ctx, applySubagentStatus } = await loadWebview()
  fresh({ S, ctx })
  const block = settle(applySubagentStatus, S, "explore", 6)
  const boundary1 = digestBoundary(ctx, S)
  assert.equal(regionBlocks(ctx).length, 1, "残块留区（等下一轮）")
  assert.equal(streamBlocks(ctx).length, 0, "未归档")
  const boundary2 = digestBoundary(ctx, S) // 下一轮：digest start 覆盖旧值（C-4）
  applySubagentStatus(subMsg("done", "explore", 6))
  assert.equal(block.parentNode, ctx.messagesEl)
  assert.equal(block.nextElementSibling, boundary2, "落点 = 下一轮边界")
  assert.ok(boundary1.isConnected, "旧轮元素不动（历史）")
})

// ─── AC-CL4：块头字段（R4）───────────────
test("T-CL17 queued 三档 + 降级（AC-CL4 · #118 A118-1）：kind 判词（slot/wait/depc）+ 两刷新路径逐字不变；started 后清", async () => {
  const { S, ctx, t, applySubagentStatus, refreshLiveHeaders } = await loadWebview()
  const { refreshBlock } = await import("../webview/activity-view.js")
  fresh({ S, ctx })
  // #118 A118-1：两条刷新路径（2 s 同点 ∥ 覆盖式重建）同读一个载体（`block._subMeta.queueInfo`）
  // ——同一断言体复跑：刷新前后逐字不变（无回落通道）。
  const stable = (block) => {
    const before = hdrOf(block)
    refreshLiveHeaders() // ① panels `_panelTimer`（2 s）同点路径
    assert.equal(hdrOf(block), before, `2 s 路径刷新后逐字不变（${JSON.stringify(before)}）`)
    refreshBlock(block) // ② 覆盖式重建路径（消息 / 状态分支 / toggle 同读点）
    assert.equal(hdrOf(block), before, `重建路径刷新后逐字不变（${JSON.stringify(before)}）`)
    return before
  }
  // 三档判词 = 载荷 `kind`（标尺 = CLI `subagent-panel.mjs:73` 状态词 / `:100-102` 状态区）+ 降级行
  // （kind 缺省 ∧ 无 reason ⇒ 中性回落 `sub.queued`——= CLI `queued.detail || "queued"` 同形）。
  const rows = [
    { id: 9, extra: { kind: "slot", position: 2 }, word: t("sub.queued"), area: t("sub.queueSlot", { n: 2 }) },
    { id: 10, extra: { kind: "wait", position: 3, waiting: "waiting-deps", reason: "waiting for: explore#1（域冲突 a.mjs）" }, word: t("sub.waiting"), area: "waiting for: explore#1（域冲突 a.mjs）" },
    { id: 11, extra: { kind: "depc", position: 1, waiting: "dependency-cancelled", reason: "dependency cancelled: plan#7" }, word: t("sub.waiting"), area: "dependency cancelled: plan#7" },
    { id: 12, extra: { position: 4 }, word: t("sub.waiting"), area: t("sub.queued") },
  ]
  for (const row of rows) {
    applySubagentStatus(subMsg("queued", "eng-coder", row.id, row.extra))
    const hdr = stable(S._subBlocks.get(`sub:eng-coder#${row.id}`))
    assert.ok(hdr.includes(`⏳ eng-coder#${row.id} · ${row.word}`), `[${row.id}] 状态词 = ${row.word}（实到 ${JSON.stringify(hdr)}）`)
    assert.ok(hdr.includes(row.area), `[${row.id}] 状态区 = ${row.area}（实到 ${JSON.stringify(hdr)}）`)
    if (row.extra.kind !== "slot") assert.ok(!hdr.includes("(slot full)"), `[${row.id}] 非 slot 档不显槽满词`)
  }
  applySubagentStatus(subMsg("started", "eng-coder", 9, { pool: true }))
  const slot = S._subBlocks.get("sub:eng-coder#9")
  assert.ok(!hdrOf(slot).includes("position"), "started 后清 queueInfo")
  assert.ok(hdrOf(slot).includes("▶") && !hdrOf(slot).includes("⏳"), "翻 running 头")
})

test("T-CL18 工具 + 参数（AC-CL4）：结构化 tool/cmd → 状态区 `tool — cmd`；结果 chunk 不改写", async () => {
  const { S, ctx, subagentChunk } = await loadWebview()
  fresh({ S, ctx })
  subagentChunk({ name: "sub:eng-coder#3", kind: "tool", text: "read {}", tool: "read", cmd: "src/x.mjs" })
  const block = S._subBlocks.get("sub:eng-coder#3")
  assert.ok(hdrOf(block).includes("read — src/x.mjs"), `状态区 = tool — cmd（实到 ${JSON.stringify(hdrOf(block))}）`)
  subagentChunk({ name: "sub:eng-coder#3", kind: "tool", text: "→ 42 lines" })
  assert.ok(hdrOf(block).includes("read — src/x.mjs"), "结果 chunk 不改写状态区（CLI currentTool 语义）")
  subagentChunk({ name: "sub:eng-coder#3", kind: "tool", text: "ls {}", tool: "ls" })
  assert.ok(hdrOf(block).includes("ls") && !hdrOf(block).includes("ls — "), "无 cmd 仅 tool")
  subagentChunk({ name: "sub:eng-coder#3", kind: "tool", text: "bash {}", tool: "bash", cmd: "x".repeat(80) })
  assert.ok(hdrOf(block).includes("bash — " + "x".repeat(59) + "…"), "cmd 截断 ≤60")
  assert.ok(!hdrOf(block).includes("x".repeat(61)), "超长部分不入头")
})

test("T-CL19 turn/计时刷新（AC-CL4）：turn 帧实时；elapsed 经 refreshLiveHeaders 刷新（不设运行态门）", async () => {
  const { S, ctx, applySubagentStatus, refreshLiveHeaders } = await loadWebview()
  fresh({ S, ctx })
  applySubagentStatus(subMsg("started", "eng-coder", 4, { pool: true, model: "glm-5.3", startedAt: Date.now() - 5000 }))
  const block = S._subBlocks.get("sub:eng-coder#4")
  assert.ok(hdrOf(block).includes("5s"), `startedAt 定格 5s（实到 ${JSON.stringify(hdrOf(block))}）`)
  applySubagentStatus(subMsg("turn", "eng-coder", 4, { turn: 3, maxTurns: 100 }))
  assert.ok(hdrOf(block).includes("turn 3/100"), "逐轮帧 → 头 turn N/M 实时（C-11③）")
  block._subMeta.startedAt = Date.now() - 65_000 // 回拨 → refresh 重算（susp 态照刷——C-11④ 不设门）
  S._turnState = "susp"
  refreshLiveHeaders()
  assert.ok(hdrOf(block).includes("65s"), `susp 态下刷新 elapsed（实到 ${JSON.stringify(hdrOf(block))}）`)
  applySubagentStatus(subMsg("done", "eng-coder", 4)) // 归档块不参与刷新（仅刷 live）
  const archived = hdrOf(block)
  refreshLiveHeaders()
  assert.equal(hdrOf(block), archived, "归档块头零变化")
})

// ─── 块标题行对齐批（2026-09-21 · 批档 §2.8 用例 1–5/10 + §2.13 用例 14–15）─────────
// 权威 = 批档 §2.1（状态区取值源闭枚举）+ §2.2（嵌套名）+ §2.11（D4 行文）。先红读数见 §5。

/** 状态区段（头行方括号之后——`headerText` 尾 + `stateWord` 拼接面）。 */
const stateZoneOf = (block) => { const h = hdrOf(block); return h.slice(h.indexOf("]") + 1) }

test("T-CL20 输出面零写入（§2.8-1 · 用户 07:14 泄漏本体）：advisor 流式 toolOutput 多行 ⇒ 状态区恒 `advisor`（文本零入）", async () => {
  const { S, ctx, subagentChunk } = await loadWebview()
  fresh({ S, ctx })
  const ch = "sub:eng-coder#7"
  subagentChunk({ name: ch, kind: "tool", text: 'advisor {"role":"advisor"}', tool: "advisor", face: "toolCall" })
  const block = S._subBlocks.get(ch)
  assert.equal(stateZoneOf(block).trim(), "advisor", `调用行后状态区 = advisor（实到 ${JSON.stringify(hdrOf(block))}）`)
  for (const text of ["审核第一行\n第二行流式\n末行流式文本", "更多流式文本\n又一行", "第三块\n最末行尾句"]) {
    subagentChunk({ name: ch, kind: "tool", text, tool: "advisor", face: "toolOutput" })
  }
  const hdr = hdrOf(block)
  assert.equal(stateZoneOf(block).trim(), "advisor", `流式后仍 = advisor（实到 ${JSON.stringify(hdr)}）`)
  assert.equal((hdr.match(/advisor/g) ?? []).length, 1, "头内 advisor 恰一次（流式文本零入）")
  assert.ok(!/流式|尾句|审核/.test(hdr), "流式文本零入头（输出只进块体行）")
})

test("T-CL21 嵌套工具名（§2.8-2 · B/D2）：sub 前缀合成 `explore#7/read — src/x.mjs`（CLI `:337` 同构）", async () => {
  const { S, ctx, subagentChunk } = await loadWebview()
  fresh({ S, ctx })
  subagentChunk({ name: "sub:eng-coder#7", kind: "tool", text: "read {}", tool: "read", cmd: "src/x.mjs", sub: "explore#7" })
  assert.equal(stateZoneOf(S._subBlocks.get("sub:eng-coder#7")).trim(), "explore#7/read — src/x.mjs", "状态区 = 全路径（label/tool + cmd）")
})

test("T-CL22 旧形态零写入（§2.8-3）：无 face / 无 tool 的文本 chunk ⇒ 状态区零变（不猜）", async () => {
  const { S, ctx, subagentChunk } = await loadWebview()
  fresh({ S, ctx })
  const ch = "sub:eng-coder#7"
  subagentChunk({ name: ch, kind: "tool", text: "read {}", tool: "read", cmd: "src/x.mjs" })
  const block = S._subBlocks.get(ch)
  const before = stateZoneOf(block)
  subagentChunk({ name: ch, kind: "tool", text: "legacy tail line" })
  subagentChunk({ name: ch, kind: "tool", text: "legacy tail line two" })
  assert.equal(stateZoneOf(block), before, "状态区逐字不变")
  assert.equal(block._subMeta.stateWord, "read — src/x.mjs", "stateWord 零改写")
  assert.ok(!hdrOf(block).includes("legacy"), "旧形态文本零入头")
})

test("T-CL23 输出面携 cmd 亦零写（§2.8-4）：face=toolOutput ⇒ 状态区零变（cmd 不入头）", async () => {
  const { S, ctx, subagentChunk } = await loadWebview()
  fresh({ S, ctx })
  const ch = "sub:eng-coder#7"
  subagentChunk({ name: ch, kind: "tool", text: "read {}", tool: "read", cmd: "src/x.mjs" })
  const block = S._subBlocks.get(ch)
  const before = stateZoneOf(block)
  subagentChunk({ name: ch, kind: "tool", text: "rm -rf x", tool: "bash", cmd: "rm -rf x", face: "toolOutput" })
  assert.equal(stateZoneOf(block), before, "状态区零变")
  assert.ok(!hdrOf(block).includes("rm -rf"), "输出面 cmd 不入头")
})

test("T-CL24 结构锁（§2.8-5 · 防复辟）：noteChunk 状态区写点恰 2（结构化 / think）∧ 无末行取值形态", () => {
  const src = readFileSync(new URL("../webview/activity-view.js", import.meta.url), "utf8")
  const start = src.indexOf("export function noteChunk(")
  assert.ok(start >= 0, "noteChunk 在位")
  const end = src.indexOf("\n}\n", start)
  const body = src.slice(start, end === -1 ? undefined : end)
  assert.equal((body.match(/meta\.stateWord\s*=/g) ?? []).length, 2, "写点恰 2（结构化分支 / think 分支）")
  assert.ok(!body.includes('split("\\n")'), "无「取文本末行」形态")
  assert.ok(!/尾句/.test(src), "旧规则字样零残留（全档）")
})

test("T-CL25 tail-3 行文（§2.11 D4 消）：折叠态尾行逐行 `│ ` 前缀 ∧ 行序 = 原序末 3 行", async () => {
  const { S, ctx, subagentChunk } = await loadWebview()
  fresh({ S, ctx })
  const { refreshBlock } = await import("../webview/activity-view.js")
  const ch = "sub:explore#9"
  for (const tool of ["alpha", "beta", "gamma", "delta"]) subagentChunk({ name: ch, kind: "tool", text: tool, tool })
  const block = S._subBlocks.get(ch)
  block.open = false
  refreshBlock(block)
  const tail = block.querySelector(".sub-tail")
  assert.ok(tail, "折叠态尾行在位")
  assert.deepEqual(tail.textContent.replace(/^\n/, "").split("\n"), ["│ beta", "│ gamma", "│ delta"], `行文/行序（实到 ${JSON.stringify(tail.textContent)}）`)
})

test("T-CL26 用户 07:14 场景一体化复现（§2.13-14）：explore#7 工具 → advisor 流式 ⇒ 状态区渐次，恒无流式文本", async () => {
  const { S, ctx, subagentChunk } = await loadWebview()
  fresh({ S, ctx })
  const ch = "sub:eng-coder#7"
  subagentChunk({ name: ch, kind: "tool", text: "read {}", tool: "read", cmd: "src/x.mjs", sub: "explore#7", face: "toolCall" })
  const block = S._subBlocks.get(ch)
  assert.equal(stateZoneOf(block).trim(), "explore#7/read — src/x.mjs", "① 子代工具行")
  subagentChunk({ name: ch, kind: "tool", text: "→ 42 lines\n(输出多行文本)", tool: "read", sub: "explore#7", face: "toolOutput" })
  assert.equal(stateZoneOf(block).trim(), "explore#7/read — src/x.mjs", "② 子代输出零写")
  subagentChunk({ name: ch, kind: "tool", text: 'advisor {"role":"advisor"}', tool: "advisor", face: "toolCall" })
  assert.equal(stateZoneOf(block).trim(), "advisor", "③ advisor 调用行 → 状态区 = advisor")
  for (const text of ["advisor 流式第一段\n末行甲", "advisor 流式第二段\n末行乙", "advisor 流式第三段\n末行丙"]) {
    subagentChunk({ name: ch, kind: "tool", text, tool: "advisor", face: "toolOutput" })
  }
  assert.equal(stateZoneOf(block).trim(), "advisor", "④ 流式后恒无流式文本")
  assert.ok(!/流式|末行/.test(hdrOf(block)), "头内零流式文本")
})

test("T-CL27 深嵌套 ≥2 层（§2.13-15 · #5 实核）：sub=explore#1/x#2 ⇒ `explore#1/x#2/read — src/x.mjs`", async () => {
  const { S, ctx, subagentChunk } = await loadWebview()
  fresh({ S, ctx })
  subagentChunk({ name: "sub:eng-coder#7", kind: "tool", text: "read {}", tool: "read", cmd: "src/x.mjs", sub: "explore#1/x#2" })
  assert.equal(stateZoneOf(S._subBlocks.get("sub:eng-coder#7")).trim(), "explore#1/x#2/read — src/x.mjs", "两端同构形（inner.join('/') + '/' + rest）")
})

