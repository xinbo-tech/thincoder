/**
 * session-reading.test.mjs — 打开态读数用例（桌面残余批 · D17 · 判据单源 = `docs/core/design/SESSION.md` §6.24；
 * 批档 = `docs/batches/2026-09-28-desktop-residuals.md` §2 · 用例组 D17-4）：
 *   ① 同源对拍 = `sessionReading(data, …)` **===** `applySession` 后同式读数（`historyPercent(agent.history, agent.provider)`）
 *      —— 四事逐项对拍：线选 / 回声归并 / 渠道合并（命中 ∥ 未命中回退）/ 公式；
 *   ② 老槽回退 = 无 `contextHistory` ⇒ `history` 经剥截断回退 ∧ 无 `activeProvider` ⇒ fallback（与 applySession 同容忍）；
 *   ③ 边界 = `data` 非对象 ⇒ 0 · `contextHistory: []` ⇒ 回退人读线 · 空历史 ⇒ 0 · 渠道已删 ⇒ fallback。
 * 纪律：纯函数直测（零盘 / 零网 / 零 electron——`sessionReading` 只读入参、零副作用）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { applySession, sessionReading } from "../session.mjs"
import { historyPercent } from "../token-window.mjs"

/** 窄窗渠道两枚（1K——读数够大，对拍值非零 ⇒ 断言有牙）；`fallback` = 未命中槽渠道时的装配口径。 */
const PROVIDERS = [{ name: "p1", model: "m1", context: 1 }, { name: "p2", model: "m2", context: 1 }]
const FALLBACK = { name: "p2", model: "m2", context: 1 }
const LONG = "y".repeat(400) // ≈ 200 token ⇒ 1K 窗约 20%

/** 同源对拍：同 data ⇒ 两径读数逐值相等（`sessionReading` × `applySession` 后同式——判据句 2）。 */
function sameSource(data, label) {
  const reading = sessionReading(data, { providers: PROVIDERS, fallback: FALLBACK })
  const agent = { provider: { ...FALLBACK }, providers: PROVIDERS, history: [], tasks: [], planMode: false }
  applySession(agent, data)
  assert.equal(reading, historyPercent(agent.history, agent.provider), `同源同式：${label}`)
  return { reading, agent }
}

// ─── ① 同源对拍（渠道合并两支 + 回声归并）────────────────────────────────

test("R1 同源对拍：渠道合并命中 / 未命中两分支 ⇒ === applySession 后同式读数", () => {
  const history = [
    { role: "user", content: LONG, ts: 1 },
    { role: "assistant", content: "ok", reasoning_content: "r", ts: 2 },
  ]
  const hit = sameSource({ history, contextHistory: [], activeProvider: "p1", activeModel: "m1" }, "支 ① 命中槽渠道")
  assert.ok(hit.reading > 0, "读数在场（非零正控）")
  assert.equal(hit.agent.provider.model, "m1", "合并后模型 = 槽 activeModel（与 applySession 同判）")
  assert.equal(hit.agent.provider.name, "p1")

  const legacy = sameSource({ history, contextHistory: [], activeProvider: "p1" }, "支 ① legacy 槽（无 activeModel）")
  assert.equal(legacy.agent.provider.model, "m1", "activeModel 缺 ⇒ 回该渠道默认模型（`||` 非 `??` 同判）")

  const miss = sameSource({ history, contextHistory: [], activeProvider: "gone", activeModel: "m9" }, "支 ② 渠道已删 ⇒ fallback")
  assert.equal(sessionReading({ history, contextHistory: [], activeProvider: "gone", activeModel: "m9" }, { providers: PROVIDERS, fallback: FALLBACK }),
    historyPercent(history, FALLBACK), "未命中 ⇒ 读数按 fallback（`loadConfig().provider` 装配口径）")

  // 回声归并同判：病态对（无 reasoning_content 的 assistant 紧邻 assistant）两径同输入同归并
  const echo = [
    { role: "user", content: LONG, ts: 1 },
    { role: "assistant", content: "first", ts: 2 },
    { role: "assistant", content: "second", reasoning_content: "rc", ts: 3 },
  ]
  const merged = sameSource({ history: [], contextHistory: echo, activeProvider: "p1", activeModel: "m1" }, "回声归并（机读线）")
  assert.equal(merged.reading, historyPercent([{ role: "user", content: LONG, ts: 1 }, { role: "assistant", content: "first\n\nsecond", reasoning_content: "rc", ts: 3 }], { ...PROVIDERS[0], model: "m1" }),
    "归并后读数 = 已归并线 × 合并渠道（归并件单源）")
})

// ─── ② 老槽回退（无 contextHistory / 无 activeProvider）────────────────────

test("R2 老槽回退：无 contextHistory ⇒ 人读线剥截断回退 ∧ 无 activeProvider ⇒ fallback", () => {
  const legacy = [
    { role: "user", content: LONG, ts: 1 },
    { role: "assistant", content: "a", ts: 2, tool_calls: [{ id: "t1", type: "function", function: { name: "grep", arguments: "{\"q\":\"x\"}…" } }] },
  ]
  const { reading, agent } = sameSource({ history: legacy, tasks: [] }, "老槽（无 contextHistory / 无 activeProvider）")
  assert.equal(agent.history[1].tool_calls[0].function.arguments, "{}", "截断参数剥为 `{}`（stripTruncatedToolArgs 同径）")
  assert.equal(reading, historyPercent(agent.history, FALLBACK), "读数走同一回退线（同源）")
  const viaReading = sessionReading({ history: legacy }, { providers: PROVIDERS, fallback: FALLBACK })
  assert.equal(viaReading, reading, "端壳两入参缺席（providers / fallback 单给）⇒ 同读")
})

// ─── ③ 边界（非对象 / 空机读线 / 空历史）───────────────────────────────

test("R3 边界：data 非对象 ⇒ 0 · contextHistory: [] ⇒ 回退人读线 · 空历史 ⇒ 0", () => {
  for (const bad of [null, undefined, 7, "slot", true]) {
    assert.equal(sessionReading(bad, { providers: PROVIDERS, fallback: FALLBACK }), 0, `非对象（${JSON.stringify(bad)}）⇒ 0`)
  }
  assert.equal(sessionReading({ history: [], contextHistory: [] }, { providers: PROVIDERS, fallback: FALLBACK }), 0, "空历史 ⇒ 0（显示门归端侧）")
  const filled = sessionReading(
    { history: [{ role: "user", content: LONG }], contextHistory: [] },
    { providers: PROVIDERS, fallback: FALLBACK },
  )
  assert.ok(filled > 0, "`contextHistory: []` = 无机读线（非空机器线）⇒ 回退人读线（与 applySession 同容忍）")
  assert.equal(sessionReading({ history: [{ role: "user", content: LONG }] }, { providers: [], fallback: FALLBACK }), filled,
    "空渠道表 ⇒ 未命中即 fallback（不抛）")
  const noOpts = sessionReading({ history: [{ role: "user", content: LONG }] })
  assert.equal(noOpts, 0, "两入参缺省 ⇒ 回退缺省 spec（128K 窗）⇒ 小历史读数 0（不抛 · 同 `historyPercent` 下界口径）")
})
