/**
 * render-granularity.test.mjs — 渲染粒度对齐批（2026-09-20 · 台账 #148）。
 *
 * 判据权威 = `docs/vsc/design/WEBVIEW.md` §5.6（内容行合并粒度——CLI `pushBlock` 对齐）+
 * 批档 `docs/batches/2026-09-20-render-granularity-batch.md` §2.4（T-G1–T-G7）。
 * 手法 = `activity-flow.test.mjs` 同款：真 `helpers/webview-env.mjs` fixture + 真
 * `webview/streaming.js` 直驱（`subagentChunk` —— `toolPanel` 载荷真形）；**段数 =
 * `.advisor-content` 子元素计数**（一 chunk 一段 vs 合并成一段 —— 症状「一 chunk 一行」的
 * 机判面）。判据文案全 ASCII（编码无关）。
 *
 * 先红读数（2026-09-20 实施轮 · 修前实跑——见批档 §5）：T-G1 = 3 段（期望 2）· T-G2 = 4 段
 * （期望 3）· T-G7 = `.advisor-tool-line`（期望 `.advisor-text`）；T-G3–T-G6 = 前后同
 * （防「过并」/ 两端同构 / 降级零变 三条锁——修前即绿）。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { setupWebview, installChatFixture } from "./helpers/webview-env.mjs"

let cleanupEnv

before(() => {
  const env = setupWebview()
  cleanupEnv = env.cleanup
  installChatFixture()
})

after(() => {
  try { window.dispatchEvent(new window.Event("unload")) } catch { /* happy-dom teardown edge */ }
  cleanupEnv()
})

/** 真模块直驱（模块缓存——每文件一次；必须在 setupWebview 之后）。 */
async function loadWebview() {
  const state = await import("../webview/state.js")
  const streaming = await import("../webview/streaming.js")
  return { S: state.S, ctx: state.ctx, subagentChunk: streaming.subagentChunk }
}

/** 逐测冷启复位（同 activity-flow `fresh`——模块缓存共享同一 S/ctx）。 */
function fresh({ S, ctx }) {
  ctx.messagesEl.replaceChildren()
  ctx.activityEl.replaceChildren()
  S._subBlocks.clear()
  S._subDescShown = true
}

const CH = "sub:eng-coder#2" // 频道名真形（sub:<role>#<id>）

/** 灌一条内容 chunk（`subagentChunk` 真入口 —— toolPanel 载荷字段随 chunk 走）。 */
function feed(wv, chunk) {
  wv.subagentChunk({ name: CH, ...chunk })
}

/** 段数 = 块内容区 `.advisor-content` 子元素（调用行 / 输出行 / 文本行各计一段）。 */
function rows(wv) {
  const block = wv.S._subBlocks.get(CH)
  assert.ok(block, "activity block exists for channel " + CH) // 诊断口径：块缺失 ⇒ 可读失败，不落 TypeError
  return [...block.querySelector(".advisor-content").children]
}

const call = (tool, text) => ({ kind: "tool", text, tool, face: "toolCall" })
const out = (tool, text, sub) => ({ kind: "tool", text, tool, face: "toolOutput", sub })

// ─── T-G1 输出并入调用行（同工具）──────────────────────────────

test("T-G1 tool merge: call + 2 output chunks (same tool) => 2 segments, RAW concat", async () => {
  const wv = await loadWebview()
  fresh(wv)
  feed(wv, call("read", 'read {"path":"x.mjs"}'))
  feed(wv, out("read", "line one\n"))
  feed(wv, out("read", "line two\n"))
  const r = rows(wv)
  assert.equal(r.length, 2, "2 segments = call row + ONE output row (3 before the fix)")
  assert.ok(r[0].classList.contains("advisor-tool-line"), "row 0 = call row")
  assert.ok(r[1].classList.contains("advisor-tool-line"), "row 1 = output row")
  assert.equal(r[1].textContent, "line one\nline two\n", "output = RAW concat, zero separator")
})

// ─── T-G2 工具名变 = 新段 ─────────────────────────────────────

test("T-G2 tool name change: read call + read output x2 + grep output => 3 segments", async () => {
  const wv = await loadWebview()
  fresh(wv)
  feed(wv, call("read", 'read {"path":"x.mjs"}'))
  feed(wv, out("read", "chunk-a "))
  feed(wv, out("read", "chunk-b"))
  feed(wv, out("grep", "hit"))
  const r = rows(wv)
  assert.equal(r.length, 3, "3 segments = call row + read output row + grep output row (4 before the fix)")
  assert.equal(r[1].textContent, "chunk-a chunk-b", "same tool => merged (RAW)")
  assert.equal(r[2].textContent, "hit", "tool name changed => fresh row")
})

// ─── T-G3 调用行恒新段（防「过并」锁）───────────────────────────

test("T-G3 call rows are always fresh: two calls (same tool) => 2 segments", async () => {
  const wv = await loadWebview()
  fresh(wv)
  feed(wv, call("read", 'read {"path":"a.mjs"}'))
  feed(wv, call("read", 'read {"path":"b.mjs"}'))
  const r = rows(wv)
  assert.equal(r.length, 2, "call row never merges (CLI fresh:true parity)")
  assert.equal(r[1].textContent, 'read {"path":"b.mjs"}', "second call text verbatim")
})

// ─── T-G4 kind 翻转分段（两端同构锁）────────────────────────────

test("T-G4 kind flip segments: text -> think -> text => 3 segments", async () => {
  const wv = await loadWebview()
  fresh(wv)
  feed(wv, { kind: "text", text: "alpha", face: "text" })
  feed(wv, { kind: "think", text: "beta", face: "think" })
  feed(wv, { kind: "text", text: "gamma", face: "text" })
  const r = rows(wv)
  assert.equal(r.length, 3, "each kind flip starts a segment (CLI pushBlock: last.kind === kind)")
  assert.ok(r[1].classList.contains("advisor-think"), "middle row = think row")
})

// ─── T-G5 不同 sub 不并（(a) 预裁锁）────────────────────────────

test("T-G5 different subs never merge: same tool, sub explore#1 / explore#2 => 2 segments", async () => {
  const wv = await loadWebview()
  fresh(wv)
  feed(wv, out("read", "first", "explore#1"))
  feed(wv, out("read", "second", "explore#2"))
  const r = rows(wv)
  assert.equal(r.length, 2, "sub differs => fresh row (nested attribution stays readable)")
  assert.equal(r[0].dataset.sub, "explore#1", "row 0 sub label")
  assert.equal(r[1].dataset.sub, "explore#2", "row 1 sub label")
})

// ─── T-G6 旧生产者降级（无 tool / 无 face）─────────────────────

test("T-G6 legacy chunks (no tool / no face) => 2 segments (old behavior kept)", async () => {
  const wv = await loadWebview()
  fresh(wv)
  feed(wv, { kind: "tool", text: "legacy one\n" })
  feed(wv, { kind: "tool", text: "legacy two\n" })
  const r = rows(wv)
  assert.equal(r.length, 2, "no face/tool => never merge (fail-safe, not guessed)")
  assert.equal(r[1].textContent, "legacy two\n", "row 1 text verbatim")
})

// ─── T-G7 kind 缺省 = text（单点默认面）───────────────────────

test("T-G7 missing kind: subagentChunk({name,text}) renders a text row, not a tool row", async () => {
  const wv = await loadWebview()
  fresh(wv)
  wv.subagentChunk({ name: CH, text: "no kind field" })
  const r = rows(wv)
  assert.equal(r.length, 1, "one row")
  assert.ok(r[0].classList.contains("advisor-text"), "row class = .advisor-text (default kind = text)")
  assert.equal(r[0].classList.contains("advisor-tool-line"), false, "not a tool row (was .advisor-tool-line before the fix)")
  assert.equal(r[0].textContent, "no kind field", "text verbatim")
})
