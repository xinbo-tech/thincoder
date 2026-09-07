/**
 * ui.test.mjs — webview DOM builders (happy-dom).
 * First DOM-level coverage for the message/tool rendering layer — the area
 * where i18n loss ("msg.user"), bad tool cards, and broken diff previews lived.
 * ui.js is a state-free leaf (§17: setLoading moved to loading.js) — static
 * import is safe; state.js-dependent chat.js loads inside the nested describe
 * AFTER the bridge stub + body (see below).
 */
import { describe, it, before, after } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { setupWebview } from "./helpers/webview-env.mjs"
import {
  buildUserMessage, buildAssistantHistory, buildToolHistory, buildHistoryMessage, escHtml,
  newBlock, addUser, buildAdvisorBlock, appendAdvisorChunk, finishTool,
} from "../webview/ui.js"

const __dirname = dirname(fileURLToPath(import.meta.url))
let env
before(() => { env = setupWebview() })
after(() => env?.cleanup())

const ctx = () => ({ messagesEl: document.createElement("div") })

describe("newBlock — one ThinCoder label per turn (live streaming)", () => {  it("paints the label only on the turn's first block — segments after tool batches get none", () => {
    const c = { messagesEl: document.createElement("div"), assistantLabeled: false }
    newBlock(c)  // turn start
    newBlock(c)  // next LLM segment after a tool batch
    newBlock(c)  // and another
    const labels = c.messagesEl.querySelectorAll(".msg-label")
    assert.equal(labels.length, 1)
    assert.equal(labels[0].textContent, "❯ ThinCoder:")
  })

  it("a new user message resets the guard so the next turn paints again", () => {
    const c = { messagesEl: document.createElement("div"), assistantLabeled: false }
    newBlock(c)
    addUser(c, "second question")
    newBlock(c)
    const labels = c.messagesEl.querySelectorAll(".msg-label")
    assert.equal(labels.length, 3, "ThinCoder + You + ThinCoder (one per turn)")
    assert.equal(labels[0].textContent, "❯ ThinCoder:")
    assert.match(labels[1].textContent, /You:/)
    assert.equal(labels[2].textContent, "❯ ThinCoder:")
  })
})

describe("escHtml", () => {
  it("escapes the four dangerous characters", () => {
    assert.equal(escHtml('<a b="c">&'), "&lt;a b=&quot;c&quot;&gt;&amp;")
  })
  it("is idempotent-safe for plain text", () => {
    assert.equal(escHtml("hello world"), "hello world")
  })
})

describe("buildUserMessage", () => {
  it("renders You label and inline content", () => {
    const el = buildUserMessage(ctx(), "hello <b>", undefined, undefined)
    assert.match(el.innerHTML, /You:/)
    assert.match(el.innerHTML, /hello &lt;b&gt;/) // esc before mdInline
  })

  it("historical message carries data-idx on the element (lazy paging) — no action buttons", () => {
    const el = buildUserMessage(ctx(), "hi", undefined, 3)
    assert.equal(el.dataset.idx, "3")
    assert.doesNotMatch(el.innerHTML, /msg-edit-btn|msg-del-btn|msg-copy-btn/)
  })

  it("live message (no idx) has no data-idx and no action buttons", () => {
    const el = buildUserMessage(ctx(), "hi", undefined, undefined)
    assert.equal(el.dataset.idx, undefined)
    assert.doesNotMatch(el.innerHTML, /msg-edit-btn|msg-del-btn|msg-copy-btn/)
  })
})

describe("buildAssistantHistory", () => {
  it("renders ThinCoder label and markdown content (turn start)", () => {
    const el = buildAssistantHistory(ctx(), "**bold**", undefined, undefined, true)
    assert.match(el.innerHTML, /ThinCoder:/)
    assert.doesNotMatch(el.innerHTML, /msg-copy-btn|msg-del-btn/)
    assert.match(el.innerHTML, /<strong>bold<\/strong>/)
  })

  it("mid-turn segment (turnStart=false) renders NO label — one label per turn", () => {
    const el = buildAssistantHistory(ctx(), "continuation", undefined, 5, false)
    assert.doesNotMatch(el.innerHTML, /ThinCoder:/)
    assert.equal(el.dataset.idx, "5") // data-idx on the element for paging
    assert.match(el.innerHTML, /continuation/)
  })
})

describe("advisor review block (in-conversation streaming)", () => {
  it("buildAdvisorBlock creates an open details block with the round label and a scrolling content region", () => {
    const el = buildAdvisorBlock("Advisor Review (Round 2)")
    assert.match(el.className, /advisor-block/)
    assert.equal(el.open, true)
    assert.equal(el.querySelector("summary").textContent, "Advisor Review (Round 2)")
    assert.ok(el.querySelector(".advisor-content"))
  })

  it("appendAdvisorChunk merges same-kind runs, marks think dim, and appends tool lines", () => {
    const el = buildAdvisorBlock("Advisor Review (Round 1)")
    appendAdvisorChunk(el, "text", "Hello")
    appendAdvisorChunk(el, "text", " world")  // same-kind merge
    assert.equal(el.querySelectorAll(".advisor-text").length, 1, "same-kind runs merge")
    assert.equal(el.querySelector(".advisor-text").textContent, "Hello world")
    appendAdvisorChunk(el, "think", "thinking…")
    assert.equal(el.querySelector(".advisor-think").textContent, "thinking…")
    appendAdvisorChunk(el, "tool", "read file.mjs")
    assert.equal(el.querySelector(".advisor-tool-line").textContent, "read file.mjs")
  })

  it("NEVER truncates — a huge review chunk stays complete inside the block", () => {
    const el = buildAdvisorBlock("Advisor Review (Round 1)")
    const huge = "x".repeat(50000) // far beyond any panel cap
    appendAdvisorChunk(el, "text", huge)
    assert.equal(el.querySelector(".advisor-content").textContent.length, 50000)
  })
})

describe("finishTool — scroll follow + auto-collapse", () => {
  function setup() {
    const messagesEl = document.createElement("div")
    let scrollCalls = 0
    // Intercept the scrollTop setter — happy-dom has no layout, so scrollHeight is 0.
    Object.defineProperty(messagesEl, "scrollTop", { set: () => { scrollCalls++ }, get: () => 0 })
    const ctx = { messagesEl, _toolRefs: {}, hadToolResult: false }
    return { ctx, getScrollCalls: () => scrollCalls }
  }

  it("success collapses the card to its summary line (header keeps → last line)", () => {
    const { ctx, getScrollCalls } = setup()
    const h = document.createElement("div")
    h.innerHTML = `<span class="tool-call-icon"></span><span class="tool-call-status"></span>`
    const b = document.createElement("div")
    b.classList.add("open") // simulate streaming-open state
    ctx._toolRefs["t1"] = { h, b, name: "bash", id: "t1", startTime: Date.now() }
    finishTool(ctx, "bash", "t1", "Wrote 42 chars to app.js")
    assert.ok(getScrollCalls() > 0, "finishTool scrolled the conversation to the bottom")
    assert.equal(ctx.hadToolResult, true)
    assert.equal(b.classList.contains("open"), false, "successful tool output auto-collapses")
    assert.equal(h.getAttribute("aria-expanded"), "false")
    assert.match(h.querySelector(".tool-call-summary").textContent, /→ Wrote 42 chars/)
  })

  it("bash wrapper lines are skipped in the collapsed summary ('(exit code 0)' never shows)", () => {
    const { ctx } = setup()
    const h = document.createElement("div")
    h.innerHTML = `<span class="tool-call-icon"></span><span class="tool-call-status"></span>`
    const b = document.createElement("div")
    ctx._toolRefs["t3"] = { h, b, name: "bash", id: "t3", startTime: Date.now() }
    finishTool(ctx, "bash", "t3", "[stdout]:\nbuild succeeded\n[stderr]:\n(exit code 0)")
    assert.match(h.querySelector(".tool-call-summary").textContent, /→ build succeeded/)
  })

  it("error stays expanded — the user must see what failed", () => {
    const { ctx } = setup()
    const h = document.createElement("div")
    h.innerHTML = `<span class="tool-call-icon"></span><span class="tool-call-status"></span>`
    const b = document.createElement("div")
    ctx._toolRefs["t2"] = { h, b, name: "bash", id: "t2", startTime: Date.now() }
    finishTool(ctx, "bash", "t2", "Error: command failed")
    assert.equal(b.classList.contains("open"), true, "error output stays expanded")
    assert.equal(h.getAttribute("aria-expanded"), "true")
  })
})

describe("buildToolHistory", () => {
  it("renders a collapsed tool card with name, done status, and summary — no delete button", () => {
    const el = buildToolHistory(ctx(), "bash", "ls\napp.js", 7)
    assert.match(el.innerHTML, /tool-call-name/)
    assert.match(el.innerHTML, /bash/)
    assert.match(el.innerHTML, /app\.js/) // summary (last line)
    assert.equal(el.dataset.idx, "7")
    assert.match(el.innerHTML, /aria-expanded="false"/)
    assert.doesNotMatch(el.innerHTML, /msg-del-btn/)
  })
})

describe("buildHistoryMessage (lazy-load dispatch)", () => {
  it("dispatches to the right element type by kind", () => {
    const u = buildHistoryMessage(ctx(), { kind: "user", text: "u", idx: 1 })
    assert.ok(u.classList.contains("message") && u.classList.contains("user"), "user → .message.user")

    const a = buildHistoryMessage(ctx(), { kind: "assistant", text: "a", idx: 2 })
    assert.ok(a.classList.contains("message") && a.classList.contains("assistant"), "assistant → .message.assistant")

    const t = buildHistoryMessage(ctx(), { kind: "tool", name: "read", text: "r", idx: 3 })
    assert.ok(t.classList.contains("tool-call"), "tool → .tool-call")
  })

  it("returns null for unknown kind or null msg", () => {
    assert.equal(buildHistoryMessage(ctx(), { kind: "bogus" }), null)
    assert.equal(buildHistoryMessage(ctx(), null), null)
    assert.equal(buildHistoryMessage(ctx(), undefined), null)
  })
})

// ─── subagentChunk: one activity block per #subId channel (R22 — blocks live in
// the BOTTOM activity panel #subagent-activity, not the message flow) ───
// Loads the real index.html body + chat.js: subagentChunk keys its blocks by the
// toolPanel message NAME — "sub:eng-coder#1" and "sub:eng-coder#2" must each open
// their own block in the panel.
describe("subagent activity stream — one block per #subId channel (R22 bottom panel)", () => {
  before(async () => {
    const html = readFileSync(join(__dirname, "..", "webview", "index.html"), "utf8")
    const body = html.match(/<body>([\s\S]*)<\/body>/)?.[1] ?? ""
    document.body.innerHTML = body.replace(/<script[\s\S]*?<\/script>/g, "")
    // chat.js (→ state.js) calls the VS Code webview bridge acquireVsCodeApi() at
    // module top — stub it so the module initializes with the real body in place.
    globalThis.acquireVsCodeApi = () => ({ postMessage: () => {}, getState: () => null, setState: () => {} })
    await import("../webview/chat.js")
    const { setActivityTickDisabled } = await import("../webview/activity.js")
    setActivityTickDisabled(true) // deterministic DOM tests — ticks driven via activityTick()
  })

  const post = (msg) => window.dispatchEvent(new window.MessageEvent("message", { data: msg }))

  it("sub:eng-coder#1 and sub:eng-coder#2 each get their own panel block, titled by label", () => {
    post({ type: "toolPanel", name: "sub:eng-coder#1", kind: "text", text: "child one says hi" })
    post({ type: "toolPanel", name: "sub:eng-coder#2", kind: "text", text: "child two says yo" })
    const panel = document.getElementById("subagent-activity")
    const blocks = panel.querySelectorAll(".sub-block")
    assert.equal(blocks.length, 2, "two independent blocks (one per #subId channel)")
    assert.equal(panel.style.display, "block", "有活动块 → 面板显示")
    assert.equal(document.querySelectorAll("#messages .sub-block").length, 0, "活动块不在 #messages（R22a——活动区与消息流分离）")
    const names = [...blocks].map((b) => b.dataset.subname)
    assert.deepEqual(names, ["sub:eng-coder#1", "sub:eng-coder#2"], "块键 = 频道名")
    const titles = [...blocks].map((b) => b.querySelector("summary").textContent)
    assert.ok(titles[0].includes("eng-coder#1"), "块头含 per-call label（title: " + titles[0] + "）")
    assert.ok(titles[1].includes("eng-coder#2"), "块头含 per-call label")
    assert.match(blocks[0].querySelector(".advisor-content").textContent, /child one says hi/, "chunk landed in block #1")
    assert.match(blocks[1].querySelector(".advisor-content").textContent, /child two says yo/, "chunk landed in block #2")
  })

  it("later chunks reuse their own block — no third block, content stays separate", () => {
    post({ type: "toolPanel", name: "sub:eng-coder#1", kind: "tool", text: "read x" })
    const blocks = document.getElementById("subagent-activity").querySelectorAll(".sub-block")
    assert.equal(blocks.length, 2, "#1 reuse does not create a new block (_subBlocks keyed by name)")
    assert.match(blocks[0].querySelector(".advisor-content").textContent, /read x/, "#1's chunk lands in block #1")
    assert.doesNotMatch(blocks[1].querySelector(".advisor-content").textContent, /read x/, "#2's block untouched")
  })
})

// ─── handleSubagentMessage: 终态即冻结入流（R22——块从活动面板移除、以冻结折叠块
// 插入 #messages 尾：身份头 [✓ key · … · done Ns] + 内容保留可展开 + preview ≤8 行；
// escalate 无 preview）───
// async 子代理 settle 即发 onSubagent({status:"done"})（subagent.mjs runChild）——
// webview 收到 done/error 即冻结对应活动块。全量跑时复用上一 describe 已加载的
// index.html body + chat.js（模块缓存，不重复执行；不重置 body——state.js 的
// ctx.messagesEl 是导入时捕获的旧元素引用）；name-pattern 单独跑时本 describe 自备
// body + bridge stub（2026-09-03 补强——见 before 内守卫）。
describe("subagent 终态 — done/error 通知即冻结入流（R22：面板移除 → #messages 尾冻结块）", () => {
  before(async () => {
    // Self-sufficient under --test-name-pattern (2026-09-03 retrofit — same guard as the
    // advisor-stream describe below): chat.js's state.js calls acquireVsCodeApi() at module
    // top and captures DOM refs — when this describe runs without the activity-stream
    // describe (name-pattern), body + bridge stub must be in place BEFORE the import.
    if (!globalThis.acquireVsCodeApi) {
      const html = readFileSync(join(__dirname, "..", "webview", "index.html"), "utf8")
      document.body.innerHTML = (html.match(/<body>([\s\S]*)<\/body>/)?.[1] ?? "").replace(/<script[\s\S]*?<\/script>/g, "")
      globalThis.acquireVsCodeApi = () => ({ postMessage: () => {}, getState: () => null, setState: () => {} })
    }
    await import("../webview/chat.js") // module cache — no re-init, no body reset
    const { setActivityTickDisabled } = await import("../webview/activity.js")
    setActivityTickDisabled(true)
  })

  const post = (msg) => window.dispatchEvent(new window.MessageEvent("message", { data: msg }))
  // 活动块在面板、冻结块在 #messages —— 同一元素跨容器移动（data-subname 键不变）
  const findBlock = (subname) =>
    [...document.querySelectorAll("#messages .sub-block, #subagent-activity .sub-block")]
      .find((b) => b.dataset.subname === subname)

  it("done 通知 → 活动面板移除该块 + 冻结块插入 #messages 尾（✓ 身份头——保留可展开——非移除）", () => {
    post({ type: "subagent", id: 3, role: "eng-coder", status: "started", startedAt: Date.now() - 2000, model: "glm-5.3", pool: true })
    post({ type: "toolPanel", name: "sub:eng-coder#3", kind: "text", text: "working…\nfinal report line" })
    let block = findBlock("sub:eng-coder#3")
    assert.ok(block, "活动区块已创建")
    assert.equal(block.parentElement?.id, "subagent-activity", "运行中块在活动面板")
    assert.equal(block.open, true, "运行中区块展开")
    post({ type: "subagent", id: 3, role: "eng-coder", status: "done", turn: 2, maxTurns: 100 })
    assert.equal(block.open, false, "done 即折叠（冻结形态）")
    assert.equal(block.parentElement?.id, "messages", "冻结块已移入消息流")
    const msgChildren = [...block.parentElement.children]
    assert.equal(msgChildren[msgChildren.length - 1], block.nextElementSibling, "冻结块 + 其 preview 位于 #messages 尾")
    assert.equal(msgChildren[msgChildren.length - 2], block, "冻结块本身在尾部倒数第二（preview 紧随）")
    assert.ok(block.classList.contains("sub-frozen"), "冻结相位 class")
    assert.match(block.querySelector(".sub-hdr").textContent, /✓ eng-coder#3 · async · glm-5.3 · done \d+s · turn 2\/100/, "冻结身份头 [✓ key · async · model · done Ns · turn n/m]（hdr: " + block.querySelector(".sub-hdr").textContent + "）")
    assert.match(block.querySelector(".advisor-content").textContent, /final report line/, "内容保留可展开")
    assert.equal(document.getElementById("subagent-activity").querySelectorAll('.sub-block[data-subname="sub:eng-coder#3"]').length, 0, "该块已从活动面板移除（腾给新任务）")
    const preview = block.nextElementSibling
    assert.ok(preview?.classList.contains("sub-report-preview"), "冻结块后落 report preview（dim ≤8 行）")
    assert.ok(block.textContent.length > 0, "块仍在 DOM（非移除——可重开阅读）")
    // 残留的下一测试隔离：块已在 #messages——作为历史保留（既有语义——不删）
  })

  it("error 终态同样冻结；started 不冻结", () => {
    post({ type: "subagent", id: 4, role: "eng-coder", status: "started", startedAt: Date.now(), model: "m", pool: true })
    post({ type: "toolPanel", name: "sub:eng-coder#4", kind: "text", text: "risky…" })
    const errBlock = findBlock("sub:eng-coder#4")
    post({ type: "subagent", id: 4, role: "eng-coder", status: "error", error: "boom" })
    assert.equal(errBlock.parentElement?.id, "messages", "error 终态冻结入流")
    assert.equal(errBlock.open, false, "error 终态折叠")
    assert.match(errBlock.querySelector(".sub-hdr").textContent, /error/, "错误终态头部标注 error")

    post({ type: "subagent", id: 5, role: "eng-coder", status: "started", startedAt: Date.now(), model: "m", pool: true })
    post({ type: "toolPanel", name: "sub:eng-coder#5", kind: "text", text: "live…" })
    const liveBlock = findBlock("sub:eng-coder#5")
    post({ type: "subagent", id: 5, role: "eng-coder", status: "started" }) // 重复 started 不终态
    assert.equal(liveBlock.open, true, "started 不折叠")
    assert.equal(liveBlock.parentElement?.id, "subagent-activity", "started 块留在活动面板")
  })

  it("escalate done（块键含 model tag）→ 同款冻结——无 preview（CLI parity——评审 #4 锁）", () => {
    post({ type: "subagent", id: 6, role: "escalate", status: "started", startedAt: Date.now(), model: "glm-5.2" })
    post({ type: "toolPanel", name: "sub:escalate glm-5.2 #6", kind: "text", text: "surgery…" })
    const block = findBlock("sub:escalate glm-5.2 #6")
    assert.ok(block, "escalate 区块已创建")
    post({ type: "subagent", id: 6, role: "escalate", status: "done", model: "glm-5.2" })
    assert.equal(block.parentElement?.id, "messages", "escalate 终态冻结入流（键含 model tag）")
    assert.equal(block.open, false, "escalate 终态同款折叠")
    assert.ok(block.nextElementSibling?.classList?.contains("sub-report-preview") !== true, "escalate 冻结块无 preview（legacy surface）")
  })

  it("§27.1 F3/T3: done 冻结后同频道迟到 toolPanel chunk → 丢弃——块内容行数/文本不变", () => {
    post({ type: "subagent", id: 10, role: "eng-coder", status: "started", startedAt: Date.now() - 2000, model: "glm-5.3", pool: true })
    post({ type: "toolPanel", name: "sub:eng-coder#10", kind: "text", text: "line one\nline two" })
    post({ type: "toolPanel", name: "sub:eng-coder#10", kind: "tool", text: "read x" })
    const block = findBlock("sub:eng-coder#10")
    post({ type: "subagent", id: 10, role: "eng-coder", status: "done" })
    assert.equal(block._subMeta.frozen, true, "done 冻结")
    const content = block.querySelector(".advisor-content")
    const rowsBefore = content.children.length
    const textBefore = content.textContent
    const stateWordBefore = block._subMeta.stateWord
    // 迟到同频道 chunk（text 合并型 + tool 新行型）→ 冻结门丢弃
    post({ type: "toolPanel", name: "sub:eng-coder#10", kind: "text", text: "late text" })
    post({ type: "toolPanel", name: "sub:eng-coder#10", kind: "tool", text: "late tool" })
    assert.equal(content.children.length, rowsBefore, "迟到 chunk 不追加（内容行数不变）")
    assert.equal(content.textContent, textBefore, "内容文本不变")
    assert.equal(block._subMeta.stateWord, stateWordBefore, "状态词不复活")
    assert.equal(block.parentElement?.id, "messages", "块仍冻结在消息流（不回活动面板）")
  })

  it("§27.1 F3/T4: 冻结后 started 状态消息 → 块不半复活（头/status/字段定格）", () => {
    post({ type: "subagent", id: 11, role: "eng-coder", status: "started", startedAt: Date.now() - 3000, model: "glm-5.3", pool: true })
    post({ type: "toolPanel", name: "sub:eng-coder#11", kind: "text", text: "working…" })
    const block = findBlock("sub:eng-coder#11")
    post({ type: "subagent", id: 11, role: "eng-coder", status: "done", turn: 4, maxTurns: 100 })
    assert.equal(block._subMeta.frozen, true, "done 冻结")
    const hdrBefore = block.querySelector(".sub-hdr").textContent
    // started-after-frozen → 丢弃（不复活——与终态分支同形）
    post({ type: "subagent", id: 11, role: "eng-coder", status: "started", startedAt: Date.now(), model: "other-model", turn: 9, maxTurns: 100 })
    assert.equal(block._subMeta.frozen, true, "冻结态保持")
    assert.equal(block._subMeta.status, "done", "status 不被 started 半复活（仍 done 终态）")
    assert.equal(block._subMeta.model, "glm-5.3", "model 不被迟到 started 覆盖")
    assert.equal(block._subMeta.turn, 4, "turn 不被迟到 started 覆盖")
    assert.equal(block.parentElement?.id, "messages", "块不复活回活动面板")
    assert.equal(block.querySelector(".sub-hdr").textContent, hdrBefore, "头定格（不重建为 live 头）")
  })
})

// ─── eng-coder 子代理内 advisor 流渲染（2026-09-03 可见性补齐）───
// runChild 现转发子代理 ctx.callbacks.onToolPanel（subagent.mjs）——advisor 形态 chunk
// 序列（start → think → text…tool 行）直接落入子代理活动块频道 sub:eng-coder#N。
// webview 复用 subagentChunk 路由 + appendAdvisorChunk 渲染：start 空文本 no-op、
// 同 kind 连续 text 合并进同一 div（无逐 chunk 换行）、tool 行为独立行、长文不截断。
describe("eng-coder 子代理内 advisor 流渲染", () => {
  before(async () => {
    // Self-sufficient under --test-name-pattern: the activity-stream describe above
    // normally loads index.html body + the bridge stub BEFORE chat.js initializes
    // (state.js calls acquireVsCodeApi at module top). Skip when the stub is already
    // up (full-file run — body and captured DOM refs stay untouched).
    if (!globalThis.acquireVsCodeApi) {
      const html = readFileSync(join(__dirname, "..", "webview", "index.html"), "utf8")
      document.body.innerHTML = (html.match(/<body>([\s\S]*)<\/body>/)?.[1] ?? "").replace(/<script[\s\S]*?<\/script>/g, "")
      globalThis.acquireVsCodeApi = () => ({ postMessage: () => {}, getState: () => null, setState: () => {} })
    }
    await import("../webview/chat.js") // module cache — no re-init when already loaded
  })

  const post = (msg) => window.dispatchEvent(new window.MessageEvent("message", { data: msg }))
  const findBlock = (subname) =>
    [...document.querySelectorAll("#messages .sub-block, #subagent-activity .sub-block")]
      .find((b) => b.dataset.subname === subname)

  it("advisor 形态流进入子代理块——start 空文本 no-op、同 kind text 合并、tool 行独立、长文完整", () => {
    const name = "sub:eng-coder#7"
    post({ type: "toolPanel", name, kind: "start", text: "", round: 1, model: "deepseek-v4" }) // advisor 开块 start chunk
    post({ type: "toolPanel", name, kind: "think", text: "\n[thinking…]\n" })
    post({ type: "toolPanel", name, kind: "text", text: "ADVISOR REVIEW round one — " })
    post({ type: "toolPanel", name, kind: "text", text: "long form conclusion VERDICT-MARKER-x7k2" })
    post({ type: "toolPanel", name, kind: "tool", text: "→ read impl-x.mjs" })
    const block = findBlock(name)
    assert.ok(block, "start chunk 即建子代理块（无空 start 元素）")
    assert.ok(block.querySelector("summary").textContent.includes("eng-coder#7"), "块头含 label（去 sub: 前缀）")
    const content = block.querySelector(".advisor-content")
    const texts = [...content.querySelectorAll(".advisor-text")].map((el) => el.textContent)
    assert.deepEqual(texts, [
      "\n[thinking…]\n",
      "ADVISOR REVIEW round one — long form conclusion VERDICT-MARKER-x7k2",
    ], "think/text 分元素；两段连续 text 合并进同一 div——无逐 chunk 换行")
    const toolLines = [...content.querySelectorAll(".advisor-tool-line")].map((el) => el.textContent)
    assert.deepEqual(toolLines, ["→ read impl-x.mjs"], "tool 行为独立行")
    assert.ok(content.textContent.includes("VERDICT-MARKER-x7k2"), "长文完整渲染（不截断）")
  })
})



// ─── §19.5 控制面 UI：⏹ 仅 running + ⏹ 点击 cancel 消息 + ⟦ev⟧stopped 冻结 + 嵌套子标 ───
// （AGENT-LOOP.md §19.5 D-M7/D-M8——T-M22/T-M23/T-M24/T-M25 webview 断言 + R22 冻结
// 入流形态。置于文件尾：chat.js 已由前序 describe 导入——window._vscode 即其捕获的
// bridge 对象——直接 patch 其 postMessage 捕获 ⏹ 点击消息。
describe("§19.5 控制面 UI（⏹ running-only + 点击 cancel + stopped 冻结 + 嵌套子标）", () => {
  before(() => {
    // 前序 describe 已确保 body + chat.js 就位——window._vscode 即 state.js 持有的 bridge
    // 对象（vscode.postMessage 调用时属性查找——可 patch 捕获）。
    window._vscode.postMessage = (m) => posts.push(m)
    posts.length = 0
  })


  const posts = []
  const post = (msg) => window.dispatchEvent(new window.MessageEvent("message", { data: msg }))
  const blockById = (id) =>
    [...document.querySelectorAll("#messages .sub-block, #subagent-activity .sub-block")]
      .find((b) => b.dataset.subid === String(id))

  it("T-M23: ⏹ 仅 running 且仅池条目（async spawn——pool 标记）——started 后块标题行出现 ⏹；done/error/settled 冻结后消失（不留残）", () => {
    // 同步（阻塞）spawn 形态的 started（无 pool）→ 块不带 ⏹（cancel 路由只认池——无效
    // ⏹ 防回归——审计 F1）
    post({ type: "subagent", id: 30, role: "explore", status: "started", model: "m" })
    post({ type: "toolPanel", name: "sub:explore#30", kind: "text", text: "sync child…" })
    const syncBlock = blockById(30)
    assert.ok(syncBlock, "同步 spawn 活动块照常创建（首 chunk）")
    assert.ok(!syncBlock.querySelector(".sub-stop-btn"), "同步 spawn 块不挂 ⏹（非池条目——点击无处可达）")
    // async（池条目）started → 块即建 + ⏹ 装上（行态 started = running——D-M7）
    post({ type: "subagent", id: 31, role: "eng-coder", status: "started", model: "m", pool: true })
    const live = blockById(31)
    assert.ok(live, "池条目 started 即建活动块（无需等待首 chunk）")
    post({ type: "toolPanel", name: "sub:eng-coder#31", kind: "text", text: "working…" })
    assert.ok(live.querySelector(".sub-stop-btn"), "池条目 running 态块标题行显示 ⏹")
    assert.ok(!live.querySelector("summary").textContent.includes("⏹"), "⏹ 不落入 summary 文本（label/折叠语义零干扰——块级 overlay）")
    assert.ok(live.querySelector("summary").textContent.includes("eng-coder#31"), "头行含块键")
    assert.equal(live.open, true, "running 块展开")
    // done → 冻结入流 + ⏹ 消失（T-M23——done/冻结后不留残）
    post({ type: "subagent", id: 31, role: "eng-coder", status: "done" })
    assert.equal(live.open, false, "done 折叠（冻结入流）")
    assert.ok(!live.querySelector(".sub-stop-btn"), "done 后 ⏹ 消失")
    assert.equal(live.parentElement?.id, "messages", "done 块已冻结入 #messages（R22）")
    // error 终态 → 冻结 + ⏹ 消失（F6——error 与 done 同走终态分支）
    post({ type: "subagent", id: 37, role: "coder", status: "started", model: "m", pool: true })
    post({ type: "toolPanel", name: "sub:coder#37", kind: "text", text: "risky…" })
    const errBlock = blockById(37)
    assert.ok(errBlock.querySelector(".sub-stop-btn"), "started → ⏹ 在")
    post({ type: "subagent", id: 37, role: "coder", status: "error", error: "boom" })
    assert.equal(errBlock.open, false, "error 折叠（冻结）")
    assert.ok(!errBlock.querySelector(".sub-stop-btn"), "error 后 ⏹ 消失")
    // settled（挂起中间态——不冻结）→ ⏹ 同样消失（子代理已完成——无可停）
    post({ type: "subagent", id: 32, role: "coder", status: "started", model: "m", pool: true })
    post({ type: "toolPanel", name: "sub:coder#32", kind: "text", text: "bg…" })
    const settledBlock = blockById(32)
    assert.ok(settledBlock.querySelector(".sub-stop-btn"), "started → ⏹ 在")
    post({ type: "suspension", active: true, running: 1, queued: 0, pending: 0 })
    post({ type: "subagent", id: 32, role: "coder", status: "settled" })
    assert.equal(settledBlock.open, true, "settled 不冻结（§17 D-S8——驻留面板等消化）")
    assert.equal(settledBlock.parentElement?.id, "subagent-activity", "settled 块驻留活动面板")
    assert.ok(!settledBlock.querySelector(".sub-stop-btn"), "settled 后 ⏹ 消失（已完成——冻结前不留停止控件）")
    assert.ok(settledBlock.querySelector("summary").textContent.includes("awaiting digestion"), "settled 头部 awaiting digestion（驻留形态）")
    post({ type: "suspension", active: false, freeze: true })
    assert.equal(settledBlock.parentElement?.id, "messages", "会话退出 freeze → settled 块冻结入流")
    post({ type: "suspension", active: false, freeze: false })
  })

  it("T-M22: ⏹ 点击 → cancelSubagent 消息（定向 id+role——不经模型）；块折叠翻转不被触发", () => {
    post({ type: "subagent", id: 33, role: "coder", status: "started", model: "m", pool: true })
    post({ type: "toolPanel", name: "sub:coder#33", kind: "text", text: "running…" })
    const block = blockById(33)
    const btn = block.querySelector(".sub-stop-btn")
    assert.ok(btn, "⏹ 在标题行")
    assert.equal(btn.dataset.subId, "33")
    assert.equal(btn.dataset.subRole, "coder")
    posts.length = 0
    btn.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }))
    const cancelMsg = posts.find((m) => m.type === "cancelSubagent")
    assert.ok(cancelMsg, "⏹ 点击发出 cancelSubagent 消息（活动面板内块——chat.js 面板委托）")
    assert.deepEqual({ id: cancelMsg.id, role: cancelMsg.role }, { id: 33, role: "coder" }, "定向目标（id + role）随消息")
    assert.equal(block.open, true, "⏹ 命中区不触发折叠翻转（与 CLI 命中列级区分同规则）")
    // 收尾：取消 → 冻结（下一用例详测）——本用例只锁定点击消息面
    post({ type: "subagent", id: 33, role: "coder", status: "cancelled" })
    assert.ok(!block.querySelector(".sub-stop-btn"), "冻结后 ⏹ 移除")
  })

  it("T-M23c/⟦ev⟧stopped: cancelled 冻结——折叠 + 标题 stopped 标记 + ⏹ 移除 + 冻结后不复活", () => {
    post({ type: "subagent", id: 34, role: "eng-coder", status: "started", model: "m", pool: true })
    post({ type: "toolPanel", name: "sub:eng-coder#34", kind: "text", text: "delivering…" })
    const block = blockById(34)
    assert.ok(block.querySelector(".sub-stop-btn"), "运行中 ⏹ 在")
    post({ type: "subagent", id: 34, role: "eng-coder", status: "cancelled" })
    assert.equal(block.open, false, "cancelled 即折叠（interrupted 冻结语义）")
    assert.equal(block.parentElement?.id, "messages", "cancelled 冻结入流（stopped 冻结形态——R22c）")
    const hdr = block.querySelector(".sub-hdr")
    assert.ok(hdr, "冻结头存在")
    assert.ok(hdr.classList.contains("sub-stopped"), "stopped 标记 class（dim）")
    assert.match(hdr.textContent, /⏹ eng-coder#34/, "stopped 冻结头 [⏹ key …]（hdr: " + hdr.textContent + "）")
    assert.ok(hdr.textContent.includes("stopped"), "stopped 词随标题渲染（en locale）")
    assert.ok(!block.querySelector(".sub-stop-btn"), "⏹ 随冻结移除")
    block.open = true // 用户重开阅读
    assert.ok(!block.querySelector(".sub-stop-btn"), "冻结块重开后 ⏹ 不复活（T-M23——仅 running 显示）")
  })

  it("T-M24/T-M25: 嵌套子标渲染——sub chunk 行首 dim 子标；同 sub 文本合并不重复前缀；无 sub 活动切回不带标；单层零变化", () => {
    // 无 started 通知 → 无 ⏹（纯渲染断言）
    const name = "sub:eng-coder#35"
    post({ type: "toolPanel", name, kind: "text", text: "inner audit note part one ", sub: "explore#1" })
    post({ type: "toolPanel", name, kind: "text", text: "part two", sub: "explore#1" })
    post({ type: "toolPanel", name, kind: "tool", text: "→ read impl-x.mjs", sub: "explore#1" })
    post({ type: "toolPanel", name, kind: "text", text: "eng-coder own reasoning" }) // 无 sub——eng-coder 自身活动
    post({ type: "toolPanel", name, kind: "text", text: "audit verdict — ", sub: "explore#1" }) // 切换回内层 → 新带标行
    post({ type: "toolPanel", name, kind: "text", text: "done", sub: "explore#1" })
    const block = blockById(35)
    const content = block.querySelector(".advisor-content")
    const textRows = [...content.querySelectorAll(".advisor-text")]
    assert.equal(textRows.length, 3, "3 个文本行段（内层合并 1 + 自身 1 + 切回内层 1）")
    const tagged = textRows.filter((el) => el.querySelector(".advisor-sub"))
    assert.equal(tagged.length, 2, "子标只出现在归属段行首（不重复前缀）")
    assert.equal(tagged[0].querySelector(".advisor-sub").textContent, "explore#1 · ", "子标形态 = 段标 + ' · '（dim 行首标记）")
    assert.equal(tagged[0].textContent, "explore#1 · inner audit note part one part two", "同 sub 连续 text 合并进同一带标行（无逐 chunk 换行/重复前缀）")
    assert.equal(textRows[1].textContent, "eng-coder own reasoning", "无 sub 活动不带子标（块主体活动照常）")
    assert.equal(tagged[1].textContent, "explore#1 · audit verdict — done", "内层再活动 → 新带标行 + 后续合并")
    const toolLines = [...content.querySelectorAll(".advisor-tool-line")]
    assert.equal(toolLines.length, 1)
    assert.equal(toolLines[0].textContent, "→ read impl-x.mjs", "工具输出行跟随最近子标归属——不重复前缀（D-M8）")
    // 单层（无嵌套 sub 字段）→ 既有形态零变化（子标 span 数 0）
    post({ type: "toolPanel", name: "sub:eng-coder#36", kind: "text", text: "plain single-layer" })
    const plain = blockById(36)
    assert.equal(plain.querySelectorAll(".advisor-sub").length, 0, "无嵌套 chunk 不带子标——单层兼容回归（T-M24）")
  })
  after(async () => {
    // 跨 describe 隔离：本 describe 独占 id 30-37 的活动块（含冻结入流块）与面板行清出
    const { S } = await import("../webview/state.js")
    S._subagentMap = {}
    S._advisorBlock = null
    for (const el of [...document.querySelectorAll("#messages .sub-block, #subagent-activity .sub-block")]) {
      if (/^3[0-7]$/.test(el.dataset.subid ?? "")) el.remove()
    }
    for (const el of [...document.querySelectorAll(".sub-report-preview")]) {
      if (/^3[0-7]$/.test(el.previousElementSibling?.dataset?.subid ?? "")) el.remove()
    }
    // 残留 live 块（如有）从 map 清出（同 S._subBlocks.clear() 语义——终态测试已冻结
    // 或停留在面板的块不再被后续用例寻址）
    for (const [k, b] of [...S._subBlocks]) {
      if (/^3[0-7]$/.test(b.dataset.subid ?? "")) S._subBlocks.delete(k)
    }
  })
})


// ═══════════════════════════════════════════════════════════════════════════
// §20 D-SD3b waiting 行（webview——T-SD11/12 镜像）：排队 spawn 返回即见 + 启动转
// running + queued 取消移除行 + 会话退出清残留
// ═══════════════════════════════════════════════════════════════════════════
describe("§20 waiting 行（排队 spawn 即见——queued→running→移除生命周期）", () => {
  before(async () => {
    // Self-sufficient under --test-name-pattern（同 subagent 完成态 describe 守卫）：
    // chat.js 的 state.js 模块顶部取 bridge + DOM refs——body + bridge stub 先于导入。
    if (!globalThis.acquireVsCodeApi) {
      const html = readFileSync(join(__dirname, "..", "webview", "index.html"), "utf8")
      document.body.innerHTML = (html.match(/<body>([\s\S]*)<\/body>/)?.[1] ?? "").replace(/<script[\s\S]*?<\/script>/g, "")
      globalThis.acquireVsCodeApi = () => ({ postMessage: () => {}, getState: () => null, setState: () => {} })
    }
    await import("../webview/chat.js") // module cache — no re-init, no body reset
    // 行状态隔离（前序 describe 的残留行会干扰行数断言——同模块单例——直接清 map）
    const { S } = await import("../webview/state.js")
    S._subagentMap = {}
  })
  const post = (msg) => window.dispatchEvent(new window.MessageEvent("message", { data: msg }))
  const rows = () => [...document.querySelectorAll("#subagent-panel .sub-item")]
  const rowTexts = () => rows().map((r) => r.textContent)

  it("T-SD11 (vscode): queued 消息建行——waiting 标注 + 等位 position（slot）/原因（wait）——面板保持（queued-only）", () => {
    // slot 等位行
    post({ type: "subagent", id: 50, role: "coder", status: "queued", position: 1 })
    let texts = rowTexts().join("\n")
    assert.ok(texts.includes("queued"), "slot 等位行显示 queued")
    assert.ok(texts.includes("queued · position 1"), "等位 position 显示（槽满等位——tool 列）")
    assert.equal(document.getElementById("subagent-panel").style.display, "block", "queued-only 面板保持（running ∪ queued 非空——D-SD3b）")
    // wait 标注（waiting-deps——原因恒标——不静默）
    post({ type: "subagent", id: 51, role: "eng-coder", status: "queued", position: 2, waiting: "waiting-deps", reason: "waiting for: coder#1（依赖未完成）" })
    texts = rowTexts().join("\n")
    assert.ok(texts.includes("waiting for: coder#1"), "waiting 原因恒标（waiting for 标注）")
    assert.ok(texts.includes("waiting-deps"), "waiting 态标注")
    // depc 标注（依赖取消失败——滞留可见）
    post({ type: "subagent", id: 52, role: "coder", status: "queued", position: 3, waiting: "dependency-cancelled", reason: "dependency cancelled: eng-coder#1 — waiting for your decision" })
    assert.ok(rowTexts().join("\n").includes("dependency cancelled"), "depc 标注恒显（滞留不静默——NF-SD）")
    // 刷新消息覆盖式更新（cancel 前移后 position 刷新——同 id 覆盖）
    post({ type: "subagent", id: 50, role: "coder", status: "queued", position: 1, waiting: "waiting-deps", reason: "waiting for: coder#1（域冲突 src/x.mjs）" })
    assert.ok(rowTexts().join("\n").includes("域冲突 src/x.mjs"), "queued 刷新覆盖（等待态变迁更新行内容）")
    // 行数 = 3（不重建不翻倍）
    assert.equal(rows().length, 3, "覆盖更新不新建行")
  })

  it("T-SD12 (vscode): started 覆盖 queued 行 → running；queued 取消（was:queued）移除行（不冻结）；suspension 退出清 queued 残留", () => {
    // name-pattern 自足：重建 50/51/52 排队行（幂等——T-SD11 已跑则覆盖刷新）
    post({ type: "subagent", id: 50, role: "coder", status: "queued", position: 1 })
    post({ type: "subagent", id: 51, role: "eng-coder", status: "queued", position: 2, waiting: "waiting-deps", reason: "waiting for: coder#1（依赖未完成）" })
    post({ type: "subagent", id: 52, role: "coder", status: "queued", position: 3, waiting: "dependency-cancelled", reason: "dependency cancelled: eng-coder#1" })
    assert.equal(rows().length, 3, "前置：3 排队行")
    // queued 行 → started（补位启动）→ 行转 running（同 id 覆盖——不新建）
    post({ type: "subagent", id: 50, role: "coder", status: "started", startedAt: Date.now(), model: "glm-5.3", pool: true })
    const texts = rowTexts().join("\n")
    assert.ok(texts.includes("running"), "启动后行转 running")
    assert.equal(rows().length, 3, "启动转 running 不新建行（同 id 覆盖——D-SD3b 同 key 语义镜像）")
    // queued 取消（was:"queued"——从未启动）→ 行移除（不留 stopped 残行）
    post({ type: "subagent", id: 51, role: "eng-coder", status: "cancelled", was: "queued" })
    const afterCancelRows = rows()
    assert.ok(
      !afterCancelRows.some((r) => String(r.querySelector(".sub-role")?.textContent ?? "").startsWith("eng-coder")),
      `queued 取消 → 行移除（不冻结——无活动块）行: ${JSON.stringify(rowTexts())}`,
    )
    assert.equal(afterCancelRows.length, 2, "行数 3 → 2（eng-coder 行移除——depc 行内容含其 id 不算）")
    // running 取消（无 was）→ 既有冻结相位（行 cancelled——不删行——stopped 语义回归）
    post({ type: "subagent", id: 50, role: "coder", status: "cancelled" })
    assert.ok(rowTexts().join("\n").includes("cancelled"), "running 取消走既有 cancelled 行态（冻结相位——was 区分）")
    // 会话退出（含 Stop 清池）→ queued 残留行清理
    post({ type: "subagent", id: 53, role: "coder", status: "queued", position: 1 })
    assert.ok(rowTexts().join("\n").includes("queued"), "depc/等位行驻留（挂起持续语义）")
    post({ type: "suspension", active: false, freeze: true })
    assert.ok(!rowTexts().join("\n").includes("queued"), "会话退出移除 queued 残留行（池已清——CLI freezeAll 兜底清场镜像）")
  })
  after(async () => {
    // 隔离：id 50-53 的活动块（started pool 建块/冻结入流）清出——行已由 before 重置
    const { S } = await import("../webview/state.js")
    S._subagentMap = {}
    for (const el of [...document.querySelectorAll("#messages .sub-block, #subagent-activity .sub-block")]) {
      if (/^5[0-3]$/.test(el.dataset.subid ?? "")) el.remove()
    }
    for (const el of [...document.querySelectorAll(".sub-report-preview")]) {
      if (/^5[0-3]$/.test(el.previousElementSibling?.dataset?.subid ?? "")) el.remove()
    }
    for (const [k, b] of [...S._subBlocks]) {
      if (/^5[0-3]$/.test(b.dataset.subid ?? "")) S._subBlocks.delete(k)
    }
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// R22 测试组（ARCHITECTURE.md R22 节 T-R22a..d——底部活动面板 + 冻结入流）。
// 测试间隔离：独占 id 60-67；先禁用真实 1s ticker（deterministic——假时钟经
// Date.now 补丁 + activityTick 驱动 elapsed 跳动），after 恢复。
// ═══════════════════════════════════════════════════════════════════════════
describe("R22 底部活动面板（T-R22a.1-3 / b.1-2 / c.1 / c.2a / d.1）", () => {
  let activity
  before(async () => {
    if (!globalThis.acquireVsCodeApi) {
      const html = readFileSync(join(__dirname, "..", "webview", "index.html"), "utf8")
      document.body.innerHTML = (html.match(/<body>([\s\S]*)<\/body>/)?.[1] ?? "").replace(/<script[\s\S]*?<\/script>/g, "")
      globalThis.acquireVsCodeApi = () => ({ postMessage: () => {}, getState: () => null, setState: () => {} })
    }
    await import("../webview/chat.js")
    activity = await import("../webview/activity.js")
    activity.setActivityTickDisabled(true) // 假定时器：真实 interval 不跑——activityTick() 驱动
    activity.resetActivity() // 隔离：清前序 describe 的残留 live 面板块/map（#messages 冻结块不动）
    const { S } = await import("../webview/state.js")
    S._subagentMap = {}
  })
  after(async () => {
    const { S } = await import("../webview/state.js")
    S._subagentMap = {}
    for (const el of [...document.querySelectorAll("#messages .sub-block, #subagent-activity .sub-block")]) {
      if (/^6[0-7]$/.test(el.dataset.subid ?? "")) el.remove()
    }
    for (const el of [...document.querySelectorAll(".sub-report-preview")]) {
      if (/^6[0-7]$/.test(el.previousElementSibling?.dataset?.subid ?? "")) el.remove()
    }
    for (const [k, b] of [...S._subBlocks]) {
      if (/^6[0-7]$/.test(b.dataset.subid ?? "")) S._subBlocks.delete(k)
    }
    activity.setActivityTickDisabled(false)
  })

  const post = (msg) => window.dispatchEvent(new window.MessageEvent("message", { data: msg }))
  const panel = () => document.getElementById("subagent-activity")
  const findBlock = (subname) =>
    [...document.querySelectorAll("#messages .sub-block, #subagent-activity .sub-block")]
      .find((b) => b.dataset.subname === subname)
  const summary = (block) => block.querySelector("summary")?.textContent ?? ""

  it("parseChannel 契约——consult/escalate 键字段不换位（评审 #1 锁：id=数字、model=标签段）", () => {
    const pc = activity.parseChannel
    assert.deepEqual(
      pc("sub:consult glm-5.3 #99"),
      { channel: "sub:consult glm-5.3 #99", label: "consult glm-5.3 #99", role: "consult", id: 99, model: "glm-5.3" },
      "consult 键解析 {role, id 数字, model 标签}",
    )
    assert.deepEqual(
      pc("sub:escalate glm-5.2 #6"),
      { channel: "sub:escalate glm-5.2 #6", label: "escalate glm-5.2 #6", role: "escalate", id: 6, model: "glm-5.2" },
      "escalate 键解析同契约",
    )
    assert.deepEqual(
      pc("sub:eng-coder#3"),
      { channel: "sub:eng-coder#3", label: "eng-coder#3", role: "eng-coder", id: 3, model: null },
      "family 键（#id 后缀）不变",
    )
  })


  it("T-R22a.1: 活动面板独立——活动块在 #subagent-activity（非 #messages）；消息流滚动不动面板", () => {
    post({ type: "toolPanel", name: "sub:coder#60", kind: "text", text: "panel work…" })
    const block = findBlock("sub:coder#60")
    assert.ok(block, "活动块已创建")
    assert.equal(block.parentElement?.id, "subagent-activity", "活动块在底部活动面板")
    assert.equal(panel().style.display, "block", "有活动块 → 面板可见")
    assert.equal(document.querySelectorAll("#messages .sub-block.sub-live").length, 0, "#messages 无活动块（冻结块例外——R22c 入流）")
    // 消息流滚动/追加不动面板（pinBottom 语义限定 #messages 内）
    const msgEl = document.getElementById("messages")
    msgEl.appendChild(document.createElement("div"))
    msgEl.scrollTop = 9999
    assert.equal(block.parentElement?.id, "subagent-activity", "消息流滚动后活动块仍在面板（容器隔离）")
    // 收尾：冻结 #60——面板清空（后续用例面板断言独立）
    post({ type: "subagent", id: 60, role: "coder", status: "done" })
    assert.equal(panel().querySelectorAll(".sub-block").length, 0, "a.1 收尾后活动面板清空")
  })

  it("T-R22a.2: 布局四层垂直序——header / #messages / #panels / #subagent-activity / 输入区（活动面板在 #toolbar 之上——消息区 1fr 让位）", () => {
    const container = document.getElementById("chat-container")
    const ids = [...container.children].map((el) => el.id)
    const order = ["session-bar", "messages", "panels", "subagent-activity", "toolbar"]
    for (const id of order) {
      assert.ok(ids.includes(id), `#${id} 存在（四层垂直序: ${ids.join(" → ")}）`)
    }
    const mIdx = ids.indexOf("messages")
    const aIdx = ids.indexOf("subagent-activity")
    const tIdx = ids.indexOf("toolbar")
    assert.ok(mIdx < aIdx && aIdx < tIdx, "活动面板位于 #messages 与输入区(#toolbar) 之间（grid auto 行——高度让位）")
  })

  it("T-R22a.3: 面板内部自滚——多块在面板内堆叠；每块内容区自带滚动域；消息区不受影响", () => {
    post({ type: "toolPanel", name: "sub:coder#61", kind: "text", text: "multi one…" })
    post({ type: "toolPanel", name: "sub:coder#61", kind: "tool", text: "→ write a.mjs" })
    post({ type: "toolPanel", name: "sub:consult glm-5.3 #62", kind: "text", text: "consult one…" })
    const blocks = panel().querySelectorAll(".sub-block")
    assert.ok(blocks.length >= 2, "多活动块同面板堆叠（面板自身滚动容器）")
    for (const b of blocks) {
      assert.ok(b.querySelector(".advisor-content"), "块内容区为独立滚动域（overflow-y）")
      assert.notEqual(b.parentElement?.id, "messages", "活动块不在消息流")
    }
    assert.equal(panel().style.display, "block", "面板保持可见")
    // 收尾：本用例的两块终态冻结——面板清空腾位（后续用例面板断言独立）
    post({ type: "subagent", id: 61, role: "coder", status: "done" })
    post({ type: "subagent", id: "consult-62-glm-5.3", role: "consult", model: "glm-5.3", sessionId: 62, status: "answered", replyPreview: "answer" })
    assert.equal(panel().querySelectorAll(".sub-block").length, 0, "全部终态后活动面板清空")
    assert.equal(panel().style.display, "none", "无活动块 → 面板隐藏（不占高——grid auto 行收起）")
  })

  it("T-R22b.1: 块头字段——[▶ key · async · model · 跳动 elapsed · turn n/m] 状态词 + tail 3 dim（假定时器驱动）", () => {
    const realNow = Date.now
    const t0 = realNow()
    try {
      // 假时钟：startedAt 落在 t0-3s——块创建即 3s；推进 3s 后 tick → 6s
      Date.now = () => t0
      post({ type: "subagent", id: 63, role: "explore", status: "started", startedAt: t0 - 3000, model: "glm-5.3", pool: true, turn: 1, maxTurns: 100 })
      const block = findBlock("sub:explore#63")
      assert.ok(block, "池条目 started 即建块")
      const hdr1 = block.querySelector(".sub-hdr").textContent
      assert.match(hdr1, /\[▶ explore#63 · async · glm-5.3 · 3s · turn 1\/100\]/, "头行 = [▶ key · async · model · elapsed · turn]（got: " + hdr1 + "）")
      assert.ok(hdr1.includes("Thinking…"), "无工具时状态词 = thinking…")
      // think → 状态词 thinking；tool → 工具行尾句入状态词
      post({ type: "toolPanel", name: "sub:explore#63", kind: "think", text: "scanning" })
      post({ type: "toolPanel", name: "sub:explore#63", kind: "tool", text: "read impl-x.mjs" })
      const hdr2 = block.querySelector(".sub-hdr").textContent
      assert.ok(hdr2.includes("read impl-x.mjs"), "工具行尾句入状态词（hdr: " + hdr2 + "）")
      // text 不覆盖工具词（CLI currentTool parity）
      post({ type: "toolPanel", name: "sub:explore#63", kind: "text", text: "findings… " })
      post({ type: "toolPanel", name: "sub:explore#63", kind: "text", text: "more" })
      assert.ok(block.querySelector(".sub-hdr").textContent.includes("read impl-x.mjs"), "text 不改状态词")
      // tail-3 dim：折叠后 summary 尾随最近 3 行内容（dim）
      block.open = false
      block.dispatchEvent(new window.Event("toggle"))
      const tail = block.querySelector(".sub-tail")
      assert.ok(tail, "折叠态块头含 tail-3（dim 上下文行）")
      const tailText = tail.textContent
      const lines = tailText.split("\n").filter((l) => l.trim())
      assert.ok(lines.length >= 1 && lines.length <= 3, "tail ≤3 行（got " + lines.length + "）")
      assert.ok(lines[lines.length - 1].includes("more"), "tail 含最近内容行（tail: " + tailText + "）")
      // 假定时器推进 3s → tick → elapsed 跳动 3s → 6s
      Date.now = () => t0 + 3000
      activity.activityTick()
      const hdr3 = block.querySelector(".sub-hdr").textContent
      assert.match(hdr3, /· 6s · turn 1\/100/, "tick 后 elapsed 跳动至 6s（hdr: " + hdr3 + "）")
    } finally {
      Date.now = realNow
    }
    // 收尾：冻结（后续面板断言独立）
    post({ type: "subagent", id: 63, role: "explore", status: "done" })
    assert.equal(findBlock("sub:explore#63").parentElement?.id, "messages", "b.1 块冻结入流")
  })

  it("T-R22b.2: ⏹ 在折叠头——running 块折叠后 ⏹ 仍可见可点（cancel 路由）", async () => {
    const { vscode } = await import("../webview/state.js")
    const posts = []
    const origPost = vscode.postMessage.bind(vscode)
    vscode.postMessage = (m) => posts.push(m)
    try {
      post({ type: "subagent", id: 64, role: "coder", status: "started", startedAt: Date.now(), model: "m", pool: true })
      const block = findBlock("sub:coder#64")
      const btn = block.querySelector(".sub-stop-btn")
      assert.ok(btn, "running 块 ⏹ 在")
      block.open = false // 折叠
      btn.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }))
      const cancelMsg = posts.find((m) => m.type === "cancelSubagent")
      assert.ok(cancelMsg, "折叠态 ⏹ 点击仍发 cancelSubagent")
      assert.deepEqual({ id: cancelMsg.id, role: cancelMsg.role }, { id: 64, role: "coder" })
    } finally {
      vscode.postMessage = origPost
    }
    // 收尾：取消 → stopped 冻结（面板清空——后续面板断言独立）
    post({ type: "subagent", id: 64, role: "coder", status: "cancelled" })
    assert.equal(panel().querySelectorAll(".sub-block").length, 0, "b.2 收尾后活动面板清空")
  })

  it("T-R22c.1: 完成冻结入流——面板清空；冻结块在 #messages 尾 [✓ key · model · done Ns]；preview ≤8 行（超 8 带 more 注记）", () => {
    const report = Array.from({ length: 12 }, (_, i) => `report line ${i + 1}`).join("\n")
    post({ type: "subagent", id: 65, role: "eng-coder", status: "started", startedAt: Date.now() - 1500, model: "glm-5.3", pool: true })
    post({ type: "toolPanel", name: "sub:eng-coder#65", kind: "text", text: report })
    const block = findBlock("sub:eng-coder#65")
    assert.ok(block, "运行块在面板")
    post({ type: "subagent", id: 65, role: "eng-coder", status: "done" })
    assert.equal(block.parentElement?.id, "messages", "冻结块入 #messages")
    const msgChildren = [...block.parentElement.children]
    assert.equal(msgChildren[msgChildren.length - 1], block.nextElementSibling, "冻结块 + 其 preview 位于 #messages 尾")
    assert.equal(msgChildren[msgChildren.length - 2], block, "冻结块在尾部倒数第二")
    assert.equal(block.open, false, "冻结折叠")
    assert.match(block.querySelector(".sub-hdr").textContent, /\[✓ eng-coder#65 · async · glm-5.3 · done \d+s\]/, "冻结身份头 [✓ key · async · model · done Ns]")
    // 展开后内容完整保留
    block.open = true
    assert.ok(block.querySelector(".advisor-content").textContent.includes("report line 12"), "内容完整保留可展开")
    block.open = false
    // preview ≤8 行 dim 落流（紧随冻结块）
    const preview = block.nextElementSibling
    assert.ok(preview?.classList.contains("sub-report-preview"), "preview 落流")
    const plines = preview.textContent.split("\n")
    const shown = plines.filter((l) => !/more lines/.test(l))
    assert.ok(shown.length <= 8, "preview ≤8 行（got " + shown.length + "）")
    assert.ok(plines.some((l) => l.includes("(4 more lines)")), "截断注记 (N more lines)")
    assert.equal(panel().querySelectorAll(".sub-block").length, 0, "活动面板清空（残留: " + [...panel().querySelectorAll(".sub-block")].map((b) => b.dataset.subname).join(",") + "）")
    assert.equal(panel().style.display, "none", "无活动块 → 面板隐藏（不占高）")
  })

  it("T-R22c.2a: stopped 冻结——cancel → ⏹ stopped 形态冻结入流（无 preview——interrupted）", () => {
    post({ type: "subagent", id: 66, role: "eng-coder", status: "started", startedAt: Date.now(), model: "m", pool: true })
    post({ type: "toolPanel", name: "sub:eng-coder#66", kind: "text", text: "partial output…" })
    const block = findBlock("sub:eng-coder#66")
    post({ type: "subagent", id: 66, role: "eng-coder", status: "cancelled" })
    assert.equal(block.parentElement?.id, "messages", "cancelled → 冻结入流")
    assert.match(block.querySelector(".sub-hdr").textContent, /\[⏹ eng-coder#66 · async · m · stopped \d+s\]/, "stopped 冻结身份头 [⏹ key · … · stopped Ns]")
    assert.ok(!block.nextElementSibling?.classList?.contains("sub-report-preview"), "stopped 冻结无 report preview（interrupted 语义）")
  })

  it("T-R22d.1: 角色全同通道——advisor async / consult / escalate 同面板同冻结（仅块键差异）", () => {
    // advisor async（role=advisor 伪角色——池条目）
    post({ type: "subagent", id: 67, role: "advisor", status: "started", startedAt: Date.now(), model: "deepseek-v4", pool: true })
    post({ type: "toolPanel", name: "sub:advisor#67", kind: "text", text: "review notes…" })
    const adv = findBlock("sub:advisor#67")
    assert.ok(adv && adv.parentElement?.id === "subagent-activity", "advisor async 块在活动面板")
    post({ type: "subagent", id: 67, role: "advisor", status: "done" })
    assert.equal(adv.parentElement?.id, "messages", "advisor done → 冻结入流")
    // consult（键 = sub:consult <model> #<sessionId>——answered 终态冻结 + preview）
    post({ type: "subagent", id: "consult-99-glm-5.3", role: "consult", model: "glm-5.3", sessionId: 99, status: "started", startedAt: Date.now() })
    post({ type: "toolPanel", name: "sub:consult glm-5.3 #99", kind: "text", text: "consultation note…" })
    const cBlock = findBlock("sub:consult glm-5.3 #99")
    assert.ok(cBlock && cBlock.parentElement?.id === "subagent-activity", "consult 块在活动面板")
    post({ type: "subagent", id: "consult-99-glm-5.3", role: "consult", model: "glm-5.3", sessionId: 99, status: "answered", replyPreview: "answer" })
    assert.equal(cBlock.parentElement?.id, "messages", "consult answered → 冻结入流")
    assert.ok(cBlock.nextElementSibling?.classList?.contains("sub-report-preview"), "consult 冻结带 preview")
    // escalate 已由「escalate done 无 preview」用例覆盖（键含 model tag——同通道）
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// Question 卡片 UI 对齐修复注（ARCHITECTURE.md 尾——question.js DOM 分层 +
// base.css question 段重排——T-QUI.1..4：结构断言 + T-Q8 形态 CSS 内容断言——
// 防静默回退）。question.js → state.js 在模块顶调 acquireVsCodeApi + 抓 DOM
// refs——与既有 nested-describe bridge 惯例同守卫；直接调用 showQuestion 做单元
// 级结构断言（chat.js 的 question 消息路由不在此重复——T-QUI 只锁本模块产物）。
// ═══════════════════════════════════════════════════════════════════════════
describe("Question 卡片 DOM 分层 + CSS 断言（T-QUI.1..4——修复注）", () => {
  let showQuestion
  const containers = []
  before(async () => {
    // Self-sufficient under --test-name-pattern（同既有 nested-describe 守卫）：
    // question.js 的 state.js 依赖在模块顶调 acquireVsCodeApi + 抓 DOM refs——
    // body + bridge stub 先于导入。全量跑时模块缓存——chat.js 图已加载，不重初始化。
    if (!globalThis.acquireVsCodeApi) {
      const html = readFileSync(join(__dirname, "..", "webview", "index.html"), "utf8")
      document.body.innerHTML = (html.match(/<body>([\s\S]*)<\/body>/)?.[1] ?? "").replace(/<script[\s\S]*?<\/script>/g, "")
      globalThis.acquireVsCodeApi = () => ({ postMessage: () => {}, getState: () => null, setState: () => {} })
    }
    const qjs = await import("../webview/question.js")
    showQuestion = qjs.showQuestion
  })
  after(() => {
    // 每用例独立容器（不进共享 #messages——不干扰消息流断言）——统一清出
    for (const c of containers) c.remove()
    containers.length = 0
  })

  const freshCtx = () => {
    const messagesEl = document.createElement("div")
    const inputEl = document.createElement("input")
    document.body.appendChild(messagesEl) // scrollIntoView 需连接树（happy-dom no-op）
    containers.push(messagesEl)
    return { messagesEl, inputEl }
  }
  const show = (ctx, q, o) => {
    showQuestion(ctx, q, o)
    return ctx.messagesEl.querySelector(".question-card")
  }
  const cardLayers = (card) => [...card.children].map((c) => c.className)

  it("T-QUI.1: options 路径——.question-options 容器在 .question-actions 前 + 选项按钮为其子（顺序保持）+ actions 层 = input/submit/cancel", () => {
    const card = show(freshCtx(), "Proceed?", ["Yes", "No", "Maybe"])
    const children = [...card.children]
    assert.equal(children.length, 3, "card 三层 = text + options + actions（got: " + cardLayers(card) + "）")
    assert.ok(children[0].classList.contains("question-text"), "第 1 层文本")
    const optionsEl = children[1]
    assert.ok(optionsEl.classList.contains("question-options"), "第 2 层 .question-options 容器")
    const actionsEl = children[2]
    assert.ok(actionsEl.classList.contains("question-actions"), "第 3 层 .question-actions")
    assert.ok(
      [...card.children].indexOf(optionsEl) < [...card.children].indexOf(actionsEl),
      ".question-options 在 .question-actions 前（DOM 序断言）",
    )
    // 选项按钮为 optionsEl 直接子——顺序保持
    const opts = [...optionsEl.children]
    assert.equal(opts.length, 3)
    assert.deepEqual(opts.map((b) => b.textContent), ["Yes", "No", "Maybe"], "选项按钮顺序保持")
    for (const b of opts) {
      assert.equal(b.tagName, "BUTTON")
      assert.match(b.className, /perm-btn/, "选项按钮带 perm-btn 基类")
      assert.match(b.className, /question-option/, "选项按钮带 question-option 标")
    }
    // actions 层 = input + submit + cancel——选项按钮已移出（不在 actions）
    assert.deepEqual(
      [...actionsEl.children].map((a) => a.className),
      ["question-input", "perm-btn approve", "perm-btn deny"],
      "actions 层仅 input+submit+cancel（原混排的选项按钮已移入 .question-options）",
    )
  })

  it("T-QUI.2（负断言）: 无 options 纯输入路径不建 .question-options 容器——undefined 与空数组同", () => {
    const c1 = show(freshCtx(), "Type your answer", undefined)
    assert.ok(!c1.querySelector(".question-options"), "无 options → 无容器")
    assert.deepEqual(cardLayers(c1), ["question-text", "question-actions"], "纯输入卡仅 text + actions 两层")
    const c2 = show(freshCtx(), "q", [])
    assert.ok(!c2.querySelector(".question-options"), "空数组 options 降级纯输入 → 同样无容器")
    assert.deepEqual(cardLayers(c2), ["question-text", "question-actions"])
  })

  it("T-QUI.3: cancel 按钮在 .question-actions 层（非 options 层）——两路径同", () => {
    const c1 = show(freshCtx(), "Proceed?", ["yes", "no"])
    const cancel1 = c1.querySelector(".perm-btn.deny")
    assert.ok(cancel1, "cancel 按钮存在（options 路径）")
    assert.equal(cancel1.textContent, "Cancel", "en locale cancel 文案")
    assert.ok(cancel1.parentElement.classList.contains("question-actions"), "options 路径 cancel 直属 .question-actions")
    assert.equal([...cancel1.parentElement.children].at(-1), cancel1, "cancel 为 actions 层末位（input → submit → cancel 序）")
    const c2 = show(freshCtx(), "Type freely", undefined)
    const cancel2 = c2.querySelector(".perm-btn.deny")
    assert.ok(cancel2, "cancel 按钮存在（纯输入路径）")
    assert.ok(cancel2.parentElement.classList.contains("question-actions"), "纯输入路径 cancel 同样在 actions 层")
  })

  it("T-QUI.4（T-Q8 形态——readFileSync CSS 内容断言——防静默回退）: 卡内字号统一 14px / 粗体去 / 选项按钮整行宽左对齐", () => {
    const css = readFileSync(join(__dirname, "..", "webview", "base.css"), "utf8")
    const rule = (sel) => {
      const m = css.match(new RegExp(sel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*\\{([^}]*)\\}"))
      assert.ok(m, "rule exists: " + sel)
      return m[1]
    }
    const card = rule(".question-card")
    assert.ok(card.includes("font-size: var(--vscode-editor-font-size, 14px)"), "card 字号 14px——文本继承（got: " + card + "）")
    const permBtn = rule(".question-card .perm-btn")
    assert.ok(permBtn.includes("font-size: var(--vscode-editor-font-size, 14px)"), "卡内按钮字号显式 14px（scoped 覆盖点）")
    assert.ok(permBtn.includes("font-weight: 400"), "粗体去——font-weight 400（原 600）")
    assert.ok(rule(".question-card .question-input").includes("font-size: var(--vscode-editor-font-size, 14px)"), "卡内 input 字号显式 14px（scoped 覆盖点）")
    const optBtn = rule(".question-options .perm-btn")
    assert.ok(optBtn.includes("width: 100%"), "选项按钮整行宽")
    assert.ok(optBtn.includes("text-align: left"), "选项按钮左对齐")
    // .question-text 规则零改动（§22 锚 T-Q8 安全——不带字号覆盖）
    const qtext = rule(".question-text")
    assert.ok(!qtext.includes("font-size"), ".question-text 未加字号规则")
  })
})