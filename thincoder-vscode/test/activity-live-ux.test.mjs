/**
 * activity-live-ux.test.mjs — VSC live 块 UX（流式跟滚 + 内容区高度 60px）机器验收。
 * 设计权威：`docs/design/WEBVIEW.md` §13（契约 C-LU1..C-LU5 / 用例 T-LU1..T-LU6 §13.6 /
 * AC-LU1..AC-LU7 §13.7）；批次档 `thincoder-cli/docs/batches/2026-09-11-VSC-LIVE-UX.md` §2。
 * 2026-09-12 PROSE-ANCHOR-RETIRE：T-LU5（CSS 文本静态断言）整删——读非测试档文本断言 = 散文锚
 *（判据见 CLI 侧设计档 TESTING.md §11）；其余用例行为面不变。
 * 手法同 activity-flow / async-visibility webview 侧：installChatFixture + 动态 import 真
 * 模块；跟滚应用在 streaming rAF 尾（happy-dom rAF = setImmediate——`until` 轮询等帧；
 * 节流 ≥50ms——重排条件含脏集，尾 chunk 不丢跟随）。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { setupWebview, installChatFixture } from "./helpers/webview-env.mjs"

let cleanupEnv

before(async () => {
  const env = setupWebview()
  cleanupEnv = env.cleanup
  installChatFixture()
  // 区监听一次性绑定（先例 activity-flow T-R10 口径）：fixture 元素跨测复用，逐测重复调用会叠加
  // 同键监听（同值写、零行为影响——按评审 hygiene 建议统一到本处一次）。
  const state = await import("../webview/state.js")
  const ui = await import("../webview/ui.js")
  ui.initScrollFollow(state.ctx) // 生产路径 scroll.js:11 同函数
})

after(() => {
  cleanupEnv()
})

/** 动态 import 真模块（模块缓存——每文件一次；必须在 setupWebview 之后）。 */
async function loadWebview() {
  const state = await import("../webview/state.js")
  const ui = await import("../webview/ui.js")
  const streaming = await import("../webview/streaming.js")
  const activity = await import("../webview/activity.js")
  return { S: state.S, ctx: state.ctx, ui, streaming, ...activity }
}

/** 逐测冷启复位（node --test 同文件串行——模块缓存共享同一 S/ctx——每测独立起点）。 */
function fresh({ S, ctx }) {
  ctx.messagesEl.replaceChildren()
  ctx.activityEl.replaceChildren()
  S._subBlocks.clear()
  ctx._pinBottom = undefined
  ctx._pinActivity = undefined
}

/** 等帧：跟滚应用在 streaming rAF 尾（happy-dom rAF = setImmediate）——轮询到谓词成立
 *  （超时返回末次判值——调用侧 assert.ok 判红，不静默通过）。 */
async function until(pred, ms = 800) {
  const t0 = Date.now()
  for (;;) {
    if (pred()) return true
    if (Date.now() - t0 > ms) return pred()
    await new Promise((r) => setTimeout(r, 5))
  }
}

/** 几何桩（跟滚判据 = scrollHeight - scrollTop - clientHeight；happy-dom 无布局——
 *  activity-flow T-R10 先例）。 */
function geometry(el, scrollHeight, clientHeight) {
  Object.defineProperty(el, "scrollHeight", { value: scrollHeight, configurable: true })
  Object.defineProperty(el, "clientHeight", { value: clientHeight, configurable: true })
}

const MAX = Number.MAX_SAFE_INTEGER
const contentOf = (block) => block.querySelector(".advisor-content")
/** 真链投喂（streaming.subagentChunk——ensureBlock → 追加 → 脏集 → rAF）。 */
const chunk = (streaming, name, text) => streaming.subagentChunk({ name, kind: "text", text })

// ─── 用例表逐行（§13.6）────────────────────────────

test("T-LU1 追加钉底（AC-LU1）：出生接线 + chunk → 脏集 → rAF → 内容区超值钉底", async () => {
  const { S, ctx, streaming, ensureBlock } = await loadWebview()
  fresh({ S, ctx })
  const block = ensureBlock("sub:explore#7") // 出生接线（buildBlock → initBlockFollow）
  const content = contentOf(block)
  geometry(content, 500, 60)
  chunk(streaming, "sub:explore#7", "line one")
  assert.ok(await until(() => content.scrollTop === MAX), "追加后内容区钉底（真链 chunk → 脏集 → rAF 超值写）")
  assert.equal(block.open, true, "live 展开态（钉底前提）")
  assert.ok(content.textContent.includes("line one"), "内容已落（钉底非空写）")
})

test("T-LU2 上滚让位（AC-LU2）：块级解钉 + 区级 pin 不被牵动（同一 wheel 各按自身几何）", async () => {
  const { S, ctx, streaming, ensureBlock } = await loadWebview()
  fresh({ S, ctx }) // 区监听已在 before 绑定（scroll.js:11 生产路径同函数）
  const block = ensureBlock("sub:explore#2")
  const content = contentOf(block)
  geometry(content, 500, 60) // 内容区 gap = 500 - 100 - 60 = 340 > 24 → 上读态
  geometry(ctx.activityEl, 210, 200) // 区 gap = 210 - 0 - 200 = 10 < 24 → 近底
  content.scrollTop = 100
  ctx._pinActivity = false // 预置反向：证明区 pin 由同一 wheel 事件按区几何重算
  content.dispatchEvent(new window.WheelEvent("wheel", { bubbles: true }))
  assert.equal(content._pinFollow, false, "块级解钉（近底 24px 判据——_pinFollow=false）")
  assert.equal(ctx._pinActivity, true, "区级仍钉底（同一事件按区几何——两层独立）")
  chunk(streaming, "sub:explore#2", "tail chunk")
  ctx.activityEl.scrollTop = 0 // 帧信号归零：区 pin 活跃 → 只有 rAF 帧尾 maybeScrollActivity 写超值
  assert.ok(await until(() => ctx.activityEl.scrollTop === MAX), "帧已处理（区 pin 帧尾应用）")
  assert.equal(content.scrollTop, 100, "追加不回弹（解钉让位——块级零写）")
  assert.equal(ctx._pinActivity, true, "区 pin 未被块级让位牵动（两层互不写对方）")
})

test("T-LU3 近底复钉（AC-LU3）：近底 wheel 复钉 → 追加钉底超值", async () => {
  const { S, ctx, streaming, ensureBlock } = await loadWebview()
  fresh({ S, ctx })
  const block = ensureBlock("sub:explore#3")
  const content = contentOf(block)
  geometry(content, 500, 60)
  content.scrollTop = 460 // gap = 500 - 460 - 60 = -20 < 24 → 近底
  content.dispatchEvent(new window.WheelEvent("wheel", { bubbles: true }))
  assert.equal(content._pinFollow, true, "近底轮滚复钉（旗标 true）")
  chunk(streaming, "sub:explore#3", "resume")
  assert.ok(await until(() => content.scrollTop === MAX), "复钉后追加钉底超值")
})

test("T-LU4 折叠零副作用（AC-LU4·边界）：open=false 追加照落、滚动被抑（含节流重排）", async () => {
  const { S, ctx, streaming, ensureBlock } = await loadWebview()
  fresh({ S, ctx })
  const block = ensureBlock("sub:plan#4")
  const content = contentOf(block)
  geometry(content, 500, 60)
  content.scrollTop = 100 // 折叠态遗留滚动位（须保原值）
  block.open = false
  chunk(streaming, "sub:plan#4", "folded append")
  ctx.activityEl.scrollTop = 0 // 帧信号归零（同 T-LU2）
  assert.ok(await until(() => ctx.activityEl.scrollTop === MAX), "帧已处理（节流重排链路——尾 chunk 不丢）")
  assert.equal(content.scrollTop, 100, "折叠态零滚动副作用（open 守卫——滚动被抑）")
  assert.ok(content.textContent.includes("folded append"), "追加照落（内容更新不因折叠被抑）")
})

test("T-LU6 防御 no-op（AC-LU4·错误面）：已移除 / 已冻结块零抛错零写", async () => {
  const { S, ctx, applySubagentStatus, ensureBlock, maybeScrollBlock } = await loadWebview()
  fresh({ S, ctx })
  // 已冻结（freezeBlock → open=false；§14 C-3：done 即时归档落流）
  const frozen = ensureBlock("sub:eng-coder#6")
  const fc = contentOf(frozen)
  geometry(fc, 500, 60)
  fc.scrollTop = 42
  applySubagentStatus({ type: "subagent", status: "done", role: "eng-coder", id: 6 })
  assert.equal(frozen.open, false, "终态折叠（open=false）")
  assert.equal(frozen.parentNode, ctx.messagesEl, "§14：折叠 + 即时归档（落流）")
  assert.doesNotThrow(() => maybeScrollBlock(frozen), "冻结块零抛错")
  assert.equal(fc.scrollTop, 42, "冻结块零写（scrollTop 保原值）")
  // 已移除（!isConnected——tombstone 残留）
  const removed = ensureBlock("sub:explore#6")
  const rc = contentOf(removed)
  geometry(rc, 500, 60)
  rc.scrollTop = 7
  removed.remove()
  assert.doesNotThrow(() => maybeScrollBlock(removed), "已移除块零抛错")
  assert.equal(rc.scrollTop, 7, "已移除块零写（scrollTop 保原值）")
  // 空防御：null 块 / 无内容区块（initBlockFollow 侧「内容区缺失零操作」同面）
  assert.equal(maybeScrollBlock(null), undefined, "null 块 no-op（零抛错）")
  const bare = document.createElement("details")
  bare.open = true
  document.body.appendChild(bare)
  assert.equal(maybeScrollBlock(bare), undefined, "无内容区块 no-op（零抛错）")
})
