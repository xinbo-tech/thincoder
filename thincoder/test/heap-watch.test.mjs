/**
 * heap-watch.test.mjs — TUI-OOM-ROOTCAUSE 批 组 4（A3——CRASH-REPORTS.md §8.6）
 * 用例表 1:1：T-HW1–T-HW5（默认启动 / 关值矩阵 / 边缘触发 / 逐字与订阅 / 失败面）。
 *
 * 形态：快层 unit——注入 sample/heapLimit/timer（零等待、零真实定时器、零真实内存压力）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { startHeapWatch, onHeapWarn, heapWatchEnabled } from "../src/heap-watch.mjs"

const GB = 1024 ** 3

/** 假定时器（spy——记录注册/unref）。 */
function spyTimer() {
  const calls = []
  const fn = (cb, ms) => {
    const h = { cb, ms, unrefCalled: false, unref() { this.unrefCalled = true } }
    calls.push(h)
    return h
  }
  fn.calls = calls
  return fn
}

test("T-HW1 默认启动：timer 注册恰一次；unref() 被调", () => {
  const timer = spyTimer()
  const w = startHeapWatch({ timer, env: {} })
  assert.equal(timer.calls.length, 1, "注册恰一次")
  assert.equal(timer.calls[0].ms, 60_000, "60s 采样间隔（默认）")
  assert.equal(timer.calls[0].unrefCalled, true, "unref（一次性命令自然退出）")
  w.stop()
})

test("T-HW2 关值矩阵：THINCODER_HEAP_WATCH ∈ {0,false,off,no}（含大小写/空格变体）→ 不注册", () => {
  for (const v of ["0", "false", "off", "no", " FALSE ", "Off", "\tNo\n"]) {
    const timer = spyTimer()
    const w = startHeapWatch({ timer, env: { THINCODER_HEAP_WATCH: v } })
    assert.equal(timer.calls.length, 0, `${JSON.stringify(v)} → 不注册`)
    assert.deepEqual(w.checkNow(), [], "关值下 checkNow 零输出")
  }
  // 未设 / 空串 / 其他值 → 启动（默认开）
  for (const v of [undefined, "", "1", "yes", "true", "on"]) {
    const timer = spyTimer()
    startHeapWatch({ timer, env: v === undefined ? {} : { THINCODER_HEAP_WATCH: v } })
    assert.equal(timer.calls.length, 1, `${JSON.stringify(v)} → 启动`)
  }
  assert.equal(heapWatchEnabled({}), true)
  assert.equal(heapWatchEnabled({ THINCODER_HEAP_WATCH: "off" }), false)
})

test("T-HW3 边缘触发：sample 50%→72%→76%→87% → 恰两行（70%/85%）；再采样不重复", () => {
  const limit = 10 * GB
  const ratios = [0.5, 0.72, 0.76, 0.87, 0.9]
  let i = 0
  const written = []
  const orig = console.error
  console.error = (s) => written.push(s)
  try {
    const w = startHeapWatch({
      timer: spyTimer(), env: {},
      sample: () => ({ heapUsed: ratios[Math.min(i, ratios.length - 1)] * limit }),
      heapLimit: () => limit,
    })
    const out = []
    for (i = 0; i < ratios.length; i++) out.push(...w.checkNow())
    assert.equal(out.length, 2, "恰两行（双档各一次）")
    assert.match(out[0], /\(72%\)/, "档 70%：行含当前比例 72%")
    assert.match(out[1], /\(87%\)/, "档 85%：行含当前比例 87%")
    assert.equal(written.length, 2, "stderr 同步两行")
    // 再采样（仍 90%）不重复
    assert.deepEqual(w.checkNow(), [])
  } finally { console.error = orig }
})

test("T-HW4 逐字与订阅：行文本逐字（正则锚）；订阅回调收到同一行", () => {
  const limit = 8 * GB
  const got = []
  const off = onHeapWarn((l) => got.push(l))
  const written = []
  const orig = console.error
  console.error = (s) => written.push(s)
  try {
    const w = startHeapWatch({
      timer: spyTimer(), env: {},
      sample: () => ({ heapUsed: Math.round(0.83 * limit) }),
      heapLimit: () => limit,
    })
    const out = w.checkNow()
    assert.equal(out.length, 1)
    assert.match(out[0], /^\[heap\] warning: heapUsed \d+\.\d GB \/ \d+\.\d GB heap limit \(83%\) — long session; consider \/new to reset context$/)
    assert.equal(got[0], out[0], "订阅回调收到同一行")
    assert.equal(written[0], out[0], "stderr 同一下行")
  } finally {
    console.error = orig
    off()
  }
  // 退订后不再收到
  const w2 = startHeapWatch({ timer: spyTimer(), env: {}, sample: () => ({ heapUsed: 9 * GB }), heapLimit: () => 10 * GB })
  const before = got.length
  w2.checkNow()
  assert.equal(got.length, before, "退订函数生效")
})

test("T-HW5 失败面：sample 抛错 → 不抛、无输出、timer 存续", () => {
  const timer = spyTimer()
  const w = startHeapWatch({ timer, env: {}, sample: () => { throw new Error("sample boom") }, heapLimit: () => 8 * GB })
  assert.doesNotThrow(() => w.checkNow())
  assert.deepEqual(w.checkNow(), [])
  assert.equal(timer.calls.length, 1, "timer 存续（未停）")
  // heapLimit 抛错同样吞
  const w2 = startHeapWatch({ timer: spyTimer(), env: {}, sample: () => ({ heapUsed: 1 }), heapLimit: () => { throw new Error("limit boom") } })
  assert.doesNotThrow(() => w2.checkNow())
})
