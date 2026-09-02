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

// ─── subagentChunk: one activity block per #subId channel (ARCHITECTURE.md 2026-08-22) ───
// Loads the real index.html body + chat.js (search/session-draft harness): subagentChunk
// keys its blocks by the toolPanel message NAME — "sub:eng-coder#1" and "sub:eng-coder#2"
// must each open their own block (the old "sub:eng-coder" shared name collapsed every
// invocation into the first block).
describe("subagent activity stream — one block per #subId channel", () => {
  before(async () => {
    const html = readFileSync(join(__dirname, "..", "webview", "index.html"), "utf8")
    const body = html.match(/<body>([\s\S]*)<\/body>/)?.[1] ?? ""
    document.body.innerHTML = body.replace(/<script[\s\S]*?<\/script>/g, "")
    // chat.js (→ state.js) calls the VS Code webview bridge acquireVsCodeApi() at
    // module top — stub it so the module initializes with the real body in place.
    globalThis.acquireVsCodeApi = () => ({ postMessage: () => {}, getState: () => null, setState: () => {} })
    await import("../webview/chat.js")
  })

  const post = (msg) => window.dispatchEvent(new window.MessageEvent("message", { data: msg }))

  it("sub:eng-coder#1 and sub:eng-coder#2 each get their own block, titled by label", () => {
    post({ type: "toolPanel", name: "sub:eng-coder#1", kind: "text", text: "child one says hi" })
    post({ type: "toolPanel", name: "sub:eng-coder#2", kind: "text", text: "child two says yo" })
    const blocks = document.querySelectorAll("#messages .sub-block")
    assert.equal(blocks.length, 2, "two independent blocks (one per #subId channel)")
    const titles = [...blocks].map((b) => b.querySelector("summary").textContent)
    assert.deepEqual(titles, ["eng-coder#1", "eng-coder#2"], "titles show the per-call label")
    assert.match(blocks[0].textContent, /child one says hi/, "chunk landed in block #1")
    assert.match(blocks[1].textContent, /child two says yo/, "chunk landed in block #2")
  })

  it("later chunks reuse their own block — no third block, content stays separate", () => {
    post({ type: "toolPanel", name: "sub:eng-coder#1", kind: "tool", text: "read x" })
    const blocks = document.querySelectorAll("#messages .sub-block")
    assert.equal(blocks.length, 2, "#1 reuse does not create a new block (_subBlocks keyed by name)")
    assert.match(blocks[0].textContent, /read x/, "#1's chunk lands in block #1")
    assert.doesNotMatch(blocks[1].textContent, /read x/, "#2's block untouched")
  })
})

// ─── handleSubagentMessage: 完成态即折叠活动区块（2026-09-02 修复轮，CLI ⟦ev⟧done 对齐）───
// async 子代理 settle 即发 onSubagent({status:"done"})（subagent.mjs runChild）——webview
// 收到 done/error 即折叠对应活动区块（保留可展开、不移除；此前只有 consult 区块在终态
// 折叠，subagent 区块会保持"运行中"外观直到回合结束）。依赖上一 describe 已加载的
// index.html body + chat.js（模块缓存，不重复执行；不重置 body——state.js 的
// ctx.messagesEl 是导入时捕获的旧元素引用）。
describe("subagent 完成态 — done/error 通知即折叠活动区块", () => {
  before(async () => {
    await import("../webview/chat.js") // module cache — no re-init, no body reset
  })

  const post = (msg) => window.dispatchEvent(new window.MessageEvent("message", { data: msg }))
  const findBlock = (label) =>
    [...document.querySelectorAll("#messages .sub-block")].find((b) => b.querySelector("summary")?.textContent === label)

  it("done 通知 → 该子代理活动区块折叠（保留可展开，不移除）", () => {
    post({ type: "toolPanel", name: "sub:eng-coder#3", kind: "text", text: "working…" })
    const block = findBlock("eng-coder#3")
    assert.ok(block, "活动区块已创建")
    assert.equal(block.open, true, "运行中区块展开")
    post({ type: "subagent", id: 3, role: "eng-coder", status: "done" })
    assert.equal(block.open, false, "done 即折叠（完成即冻结）")
    assert.ok(findBlock("eng-coder#3"), "区块保留在会话流（可重新展开——非移除）")
  })

  it("error 终态同样折叠；started 不折叠", () => {
    post({ type: "toolPanel", name: "sub:eng-coder#4", kind: "text", text: "risky…" })
    const errBlock = findBlock("eng-coder#4")
    post({ type: "subagent", id: 4, role: "eng-coder", status: "error", error: "boom" })
    assert.equal(errBlock.open, false, "error 终态折叠")

    post({ type: "toolPanel", name: "sub:eng-coder#5", kind: "text", text: "live…" })
    const liveBlock = findBlock("eng-coder#5")
    post({ type: "subagent", id: 5, role: "eng-coder", status: "started" })
    assert.equal(liveBlock.open, true, "started 不折叠")
  })

  it("escalate done（区块键含 model tag）→ 同款折叠", () => {
    post({ type: "toolPanel", name: "sub:escalate glm-5.2 #6", kind: "text", text: "surgery…" })
    const block = [...document.querySelectorAll("#messages .sub-block")].find((b) => b.querySelector("summary")?.textContent === "escalate glm-5.2 #6")
    assert.ok(block, "escalate 区块已创建")
    post({ type: "subagent", id: 6, role: "escalate", status: "done", model: "glm-5.2" })
    assert.equal(block.open, false, "escalate 终态同款折叠（键含 model tag）")
  })
})

