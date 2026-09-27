/**
 * cmd-timers.test.mjs — `/timers` 只读列表（T-TW11——批 timer-wake 2026-09-27 · 台账 #444）。
 *
 * 设计权威 = `docs/cli/design/TUI.md` §7.6（显示形态单源）+ `docs/core/design/AGENT-LOOP-ASYNC-POOL.md`
 * §6.30（机制；取消面不做）；用例表 = §6.30.7，宿主落点 = §6.30.7 末「用例宿主」行。
 * 形态：handler 直驱 + `pushLine` 桩——零 TTY / 零定时器 / 零真实等待。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { handleTimersCommand } from "../src/tui/cmd-timers.mjs"
import { C } from "../src/tui/ansi.mjs"

const run = async (timers) => {
  const lines = []
  await handleTimersCommand({ agent: { _pendingTimers: timers }, pushLine: (text, color) => lines.push({ text: String(text), color }) })
  return lines
}

test("T-TW11 列表：在途两条 ⇒ 逐条 dim 行（`⏰<i> · 剩余 <mm:ss> · <message 首行（截断）>`）", async () => {
  const now = Date.now()
  const lines = await run([
    { id: 1, expiresAt: now + 90_000, message: "check the deploy\nsecond line (不入列表)" },
    { id: 2, expiresAt: now + 30_000, message: "x".repeat(200) },
  ])
  assert.equal(lines.length, 2, "逐条一行")
  assert.match(lines[0].text, /^⏰1 · 剩余 0?1:(29|30) · check the deploy$/, "编号 1 / mm:ss / 首行")
  assert.ok(!lines[0].text.includes("second line"), "只取 message 首行")
  assert.match(lines[1].text, /^⏰2 · 剩余 00:(29|30) · x+…$/, "编号 2 / 长 message 截断 + `…`")
  assert.ok(lines.every((l) => l.color === C.dim), "全 dim 行（最薄反馈面）")
})

test("T-TW11b 空态：零在途 ⇒ 恰一行 `无在途 timer`（命令仍可调——非模态）", async () => {
  const lines = await run([])
  assert.equal(lines.length, 1, "恰一行")
  assert.equal(lines[0].text, "无在途 timer", "空态行逐字")
  assert.equal(lines[0].color, C.dim, "dim")
})

test("T-TW11c 边界：到期未送达 ⇒ 剩余夹到 `00:00`（到期态另由状态行警示色承载）", async () => {
  const lines = await run([{ id: 1, expiresAt: Date.now() - 5_000, message: "late" }])
  assert.match(lines[0].text, /^⏰1 · 剩余 00:00 · late$/, "夹零（不出现负值）")
})
