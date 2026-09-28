/**
 * heartbeat.test.mjs — P7 渲染面 2s 拍用例（「对齐第三批」小修族 · 外围 7；形态单源 =
 * `docs/desktop/design/UI.md` §1「本批注（对齐第三批 · 小修族）」外围 7）。判据面 = `renderer/heartbeat.mjs` 两件：
 *   ① 拍体 `refreshLiveBlocks`（判据 `isConnected ∧ !frozen` —— 走时词面只对活块有意义；`refresh` 注入缝 = 平 node 直测）；
 *   ② 定时器生命周期 `createHeartbeat`（**假钟逐拍 + `stop()` 清点（幂等）** —— 首个渲染面定时器的清点纪律）。
 * 装配面（`renderer/app.mjs` 单点 `setInterval` + `unload` 清点 + 状态行重挂判据）为**源面判据**（app.mjs 带
 * `/rc/` 与 `document` 装配面 ⇒ 不整档装载；沿 `views-locks` 先例）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { HEARTBEAT_MS, createHeartbeat, refreshLiveBlocks } from "../renderer/heartbeat.mjs"

/** 假块（核件 `refreshBlock` 读取面最小形：`isConnected` / `_subMeta.frozen`）。 */
const fakeBlock = (over = {}) => ({ isConnected: true, _subMeta: { frozen: false }, ...over })
/** 假根（`.sub-block` 表 —— 表外根 ⇒ 零动作）。 */
const fakeRoot = (blocks) => ({ querySelectorAll: (selector) => (selector === ".sub-block" ? blocks : []) })

test("U201: 拍体 —— 在飞块逐块刷新（isConnected ∧ !frozen 判据 · 逐块 ±）", () => {
  const hit = []
  const refresh = (block) => hit.push(block)
  const live = fakeBlock()
  const frozen = fakeBlock({ _subMeta: { frozen: true } })
  const detached = fakeBlock({ isConnected: false })
  assert.equal(refreshLiveBlocks(fakeRoot([live, frozen, detached]), refresh), 1, "只刷在飞块（已冻 / 已摘不入 —— 走时词面判据）")
  assert.deepEqual(hit, [live], "逐块调 refresh（本块恰一次）")
  assert.equal(refreshLiveBlocks(fakeRoot([live, fakeBlock()]), refresh), 2, "多枚在飞 ⇒ 逐块（回值 = 刷块数）")
  assert.equal(refreshLiveBlocks(null, refresh), 0, "根缺位 ⇒ 零动作零抛")
  assert.equal(refreshLiveBlocks({}, refresh), 0, "根无查询面 ⇒ 零动作")
  assert.equal(refreshLiveBlocks(fakeRoot([]), refresh), 0, "零块 ⇒ 零刷")
})

test("U202: 定时器 —— 假钟逐拍 ∧ stop 清点（幂等）∧ 注入面", (ctx) => {
  ctx.mock.timers.enable({ apis: ["setInterval"] })
  let beats = 0
  const beat = createHeartbeat({ tick: () => { beats += 1 } })
  assert.equal(beat.intervalMs, HEARTBEAT_MS, "拍读 = 单源常数（HEARTBEAT_MS —— 2s）")
  ctx.mock.timers.tick(HEARTBEAT_MS - 1)
  assert.equal(beats, 0, "未及一拍 ⇒ 零调（非立即执行）")
  ctx.mock.timers.tick(1)
  assert.equal(beats, 1, "恰一拍 ⇒ 一次")
  ctx.mock.timers.tick(HEARTBEAT_MS * 2)
  assert.equal(beats, 3, "逐拍（时钟再推两拍 ⇒ 累计三调）")
  beat.stop()
  ctx.mock.timers.tick(HEARTBEAT_MS * 4)
  assert.equal(beats, 3, "stop ⇒ 零调（清点纪律）")
  beat.stop()
  assert.equal(beats, 3, "stop 幂等（重复调零动作）")

  const idle = createHeartbeat({})
  ctx.mock.timers.tick(HEARTBEAT_MS)
  assert.equal(beats, 3, "tick 缺 / 非函数 ⇒ 空拍（零定时器 —— 装配面漏给不静默起火）")
  idle.stop()

  const calls = []
  const timers = {
    setInterval: (fn, ms) => { calls.push(["set", ms]); return { id: fn } },
    clearInterval: (handle) => calls.push(["clear", handle.id]),
  }
  const injected = createHeartbeat({ tick: () => { beats += 1 }, timers, intervalMs: 5 })
  assert.deepEqual(calls, [["set", 5]], "注入面：定时器注册一次（拍读随注入）")
  injected.stop()
  assert.equal(calls[1][0], "clear", "stop ⇒ 清点走注入件")
  assert.equal(calls.length, 2, "清点恰一次（幂等）")
})

test("U203: 装配面 —— app.mjs 单点 `setInterval` + `unload` 清点 + 两事拍体（源面判据）", () => {
  const app = readFileSync(new URL("../renderer/app.mjs", import.meta.url), "utf8")
  assert.ok(app.includes("createHeartbeat({ tick: heartbeatTick })"), "拍装配单点 = app.mjs（「对齐第三批」P7）")
  assert.ok(app.includes('globalThis.addEventListener?.("unload"'), "卸载清点挂点在场")
  assert.ok(/heartbeat\.stop\(\)/.test(app), "卸载回调调 `stop()`（清点）")
  assert.ok(app.includes("refreshLiveBlocks(document.querySelector(POOL_SLOT))"), "拍体① = 池面在飞块逐块核件 `refreshBlock`")
  assert.ok(app.includes("paintStatus(state)"), "拍体② = 本键位标含 `running` ⇒ 状态行重挂")
  assert.ok(/codes\.includes\("running"\)/.test(app), "状态行重挂判据 = 本键位标含 `running`（耗时段走时）")
})
