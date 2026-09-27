/**
 * stream.test.mjs — 核纯函数层：rAF 降频缝合（`flow/stream.mjs`——`streaming.js:36-79` / `:112`
 * 的调度语义逐条对拍；目标元素以假对象直驱——无 DOM 依赖）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { createStreamRenderer, paintStreamTarget, paintReasoningTarget, STREAM_RENDER_MIN_MS } from "../flow/stream.mjs"

const fakeEl = () => ({ innerHTML: "", textContent: "", scrollTop: 0, scrollHeight: 42 })

test("常量：STREAM_RENDER_MIN_MS = 50（长回复降频单源）", () => {
  assert.equal(STREAM_RENDER_MIN_MS, 50)
})

test("单目标重渲：md 全量渲 + 推理目标追加滚动到底", () => {
  const el = fakeEl()
  paintStreamTarget(el, "# head")
  assert.equal(el.innerHTML, "<h1>head</h1>")
  const rel = fakeEl()
  paintReasoningTarget(rel, "hello")
  assert.equal(rel.innerHTML, "<p>hello</p>")
  assert.equal(rel.scrollTop, rel.scrollHeight)
  paintStreamTarget(null, "x") // 空目标零抛错
})

test("缝合器：同帧合并（多次 mark 只排一帧）+ 帧内双目标重渲 + 脏集逐块应用 + 帧尾回调", () => {
  const frames = []
  const clock = { t: 1000 }
  const rel = fakeEl(), bub = fakeEl()
  const scrolled = []
  let ends = 0
  const r = createStreamRenderer({
    raf: (cb) => frames.push(cb),
    now: () => clock.t,
    reasoning: () => ({ el: rel, raw: "# think" }),
    token: () => ({ el: bub, raw: "body" }),
    subScroll: (blocks) => scrolled.push(...blocks),
    frameEnd: () => { ends++ },
  })
  r.markReasoning()
  r.markToken()
  r.markSubScroll("blkA")
  assert.equal(frames.length, 1, "同帧只排一次")
  frames.shift()()
  assert.equal(rel.innerHTML, "<h1>think</h1>")
  assert.equal(bub.innerHTML, "<p>body</p>")
  assert.deepEqual(scrolled, ["blkA"])
  assert.equal(ends, 1)
  assert.equal(frames.length, 0)
})

test("降频：距上次 <50ms 跳过并续排；≥50ms 才渲", () => {
  const frames = []
  const clock = { t: 1000 }
  const bub = fakeEl()
  let raw = "a"
  const r = createStreamRenderer({ raf: (cb) => frames.push(cb), now: () => clock.t, token: () => ({ el: bub, raw }) })
  r.markToken()
  frames.shift()() // t=1000 ⇒ 渲
  assert.equal(bub.innerHTML, "<p>a</p>")
  clock.t = 1005
  raw = "ab"
  r.markToken()
  assert.equal(frames.length, 1)
  frames.shift()() // +5ms ⇒ 跳过
  assert.equal(bub.innerHTML, "<p>a</p>", "未到 50ms 不重渲")
  assert.equal(frames.length, 1, "仍有脏内容 ⇒ 续排")
  clock.t = 1060
  frames.shift()()
  assert.equal(bub.innerHTML, "<p>ab</p>", "≥50ms ⇒ 渲")
})

test("flush：同步尾帧（无 rAF 参与）；目标缺位 ⇒ 脏位不清（回位后补渲）", () => {
  const frames = []
  const bub = fakeEl()
  let target = null
  let raw = "tail"
  const r = createStreamRenderer({ raf: (cb) => frames.push(cb), now: () => 0, token: () => target })
  r.markToken()
  r.flush() // 目标缺位：不渲、不清位
  assert.equal(frames.length, 1, "mark 已排帧")
  target = { el: bub, raw }
  r.flush()
  assert.equal(bub.innerHTML, "<p>tail</p>", "flush 直渲（终帧必须先于指针复位画出）")
  frames.shift()() // 已清位 ⇒ 帧内零重渲
  assert.equal(bub.innerHTML, "<p>tail</p>")
})
