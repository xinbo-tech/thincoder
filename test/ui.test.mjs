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
// 折叠，subagent 区块会保持"运行中"外观直到回合结束）。全量跑时复用上一 describe 已加载
// 的 index.html body + chat.js（模块缓存，不重复执行；不重置 body——state.js 的
// ctx.messagesEl 是导入时捕获的旧元素引用）；name-pattern 单独跑时本 describe 自备
// body + bridge stub（2026-09-03 补强——见 before 内守卫）。
describe("subagent 完成态 — done/error 通知即折叠活动区块", () => {
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
  const findBlock = (label) =>
    [...document.querySelectorAll("#messages .sub-block")].find((b) => b.querySelector("summary")?.textContent === label)

  it("advisor 形态流进入子代理块——start 空文本 no-op、同 kind text 合并、tool 行独立、长文完整", () => {
    const name = "sub:eng-coder#7"
    post({ type: "toolPanel", name, kind: "start", text: "", round: 1, model: "deepseek-v4" }) // advisor 开块 start chunk
    post({ type: "toolPanel", name, kind: "think", text: "\n[thinking…]\n" })
    post({ type: "toolPanel", name, kind: "text", text: "ADVISOR REVIEW round one — " })
    post({ type: "toolPanel", name, kind: "text", text: "long form conclusion VERDICT-MARKER-x7k2" })
    post({ type: "toolPanel", name, kind: "tool", text: "→ read impl-x.mjs" })
    const block = findBlock("eng-coder#7")
    assert.ok(block, "start chunk 即建子代理块（无空 start 元素）")
    assert.equal(block.querySelector("summary").textContent, "eng-coder#7", "标题 = label（去 sub: 前缀）")
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
// （AGENT-LOOP.md §19.5 D-M7/D-M8——T-M22/T-M23/T-M24/T-M25 webview 断言。置于文件尾：
// chat.js 已由前序 describe 导入——window._vscode 即其捕获的 bridge 对象——直接 patch 其
// postMessage 捕获 ⏹ 点击消息（不经自己 import——无首序/残留时序问题）。
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
    [...document.querySelectorAll("#messages .sub-block")].find((b) => b.querySelector("summary")?.textContent.includes(`#${id}`))

  it("T-M23: ⏹ 仅 running 且仅池条目（async spawn——pool 标记）——started 后块标题行出现 ⏹；done/error/settled 冻结后消失（不留残）", () => {
    // 同步（阻塞）spawn 形态的 started（无 pool）→ 块不带 ⏹（cancel 路由只认池——无效
    // ⏹ 防回归——审计 F1）
    post({ type: "subagent", id: 30, role: "explore", status: "started", model: "m" })
    post({ type: "toolPanel", name: "sub:explore#30", kind: "text", text: "sync child…" })
    const syncBlock = blockById(30)
    assert.ok(syncBlock, "同步 spawn 活动块照常创建")
    assert.ok(!syncBlock.querySelector(".sub-stop-btn"), "同步 spawn 块不挂 ⏹（非池条目——点击无处可达）")
    // async（池条目）started → ⏹ 装上（行态 started = running）
    post({ type: "subagent", id: 31, role: "eng-coder", status: "started", model: "m", pool: true })
    post({ type: "toolPanel", name: "sub:eng-coder#31", kind: "text", text: "working…" })
    const live = blockById(31)
    assert.ok(live, "活动块已创建")
    assert.ok(live.querySelector(".sub-stop-btn"), "池条目 running 态块标题行显示 ⏹")
    assert.equal(live.querySelector("summary").textContent, "eng-coder#31", "⏹ 不落入 summary 文本（label 匹配/折叠语义零干扰）")
    assert.equal(live.open, true, "running 块展开")
    // done → 折叠 + ⏹ 消失（T-M23——done/冻结后不留残）
    post({ type: "subagent", id: 31, role: "eng-coder", status: "done" })
    assert.equal(live.open, false, "done 折叠（既有语义回归）")
    assert.ok(!live.querySelector(".sub-stop-btn"), "done 后 ⏹ 消失")
    // error 终态 → 折叠 + ⏹ 消失（F6——error 与 done 同走终态分支）
    post({ type: "subagent", id: 37, role: "coder", status: "started", model: "m", pool: true })
    post({ type: "toolPanel", name: "sub:coder#37", kind: "text", text: "risky…" })
    const errBlock = blockById(37)
    assert.ok(errBlock.querySelector(".sub-stop-btn"), "started → ⏹ 在")
    post({ type: "subagent", id: 37, role: "coder", status: "error", error: "boom" })
    assert.equal(errBlock.open, false, "error 折叠")
    assert.ok(!errBlock.querySelector(".sub-stop-btn"), "error 后 ⏹ 消失")
    // settled（挂起中间态——不折叠）→ ⏹ 同样消失（子代理已完成——无可停）
    post({ type: "subagent", id: 32, role: "coder", status: "started", model: "m", pool: true })
    post({ type: "toolPanel", name: "sub:coder#32", kind: "text", text: "bg…" })
    const settledBlock = blockById(32)
    assert.ok(settledBlock.querySelector(".sub-stop-btn"), "started → ⏹ 在")
    post({ type: "suspension", active: true, running: 1, queued: 0, pending: 0 })
    post({ type: "subagent", id: 32, role: "coder", status: "settled" })
    assert.equal(settledBlock.open, true, "settled 不折叠（§17 D-S8——驻留等消化）")
    assert.ok(!settledBlock.querySelector(".sub-stop-btn"), "settled 后 ⏹ 消失（已完成——冻结前不留停止控件）")
    post({ type: "suspension", active: false, freeze: true })
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
    assert.ok(cancelMsg, "⏹ 点击发出 cancelSubagent 消息")
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
    const tag = block.querySelector(".sub-stopped")
    assert.ok(tag, "标题行带 stopped 标记")
    assert.equal(tag.textContent.trim(), "· stopped", "stopped 标记文本（CLI 冻结标题 parity——en locale）")
    assert.ok(block.querySelector("summary").textContent.includes("stopped"), "stopped 随标题渲染")
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
    // 跨 describe 隔离：本 describe 独占 id 31-36 的会话块/面板行清出
    const { S } = await import("../webview/state.js")
    S._subBlocks.clear()
    S._subagentMap = {}
    S._advisorBlock = null
    for (const el of [...document.querySelectorAll("#messages .sub-block")]) {
      const label = el.querySelector("summary")?.textContent ?? ""
      if (/#(3[0-7])$/.test(label)) el.remove()
    }
  })
})
