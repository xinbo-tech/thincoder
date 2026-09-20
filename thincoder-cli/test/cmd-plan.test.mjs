/**
 * cmd-plan.test.mjs — `/plan` 命令面（ENG-PLAN-EXCLUSION 批 · FR31 ② / AC13 = T11 + T14 回归）。
 *
 * 设计权威 = `docs/core/design/ENGINEERING-MODE-V2.md` §2.3 E7「命令面逐面钉定」表（CLI 行）：
 * 工程真值 = `agent.config.agent.engineering`（核单源同键）；拒绝出口 = 前置判 + 零翻转（不写
 * `planMode`）+ TUI 提示行（共用文案常量逐字，与 ACP 两面同源）。
 *
 * 手法 = ctx 直驱（slash-commands 调用形态，同 `cmd-eng.test.mjs` 先例）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { handlePlanCommand } from "../src/tui/cmd-plan.mjs"
import { PLAN_ENGINEERING_REFUSED } from "@thincoder/core/agent-tools/plan.mjs"

/** ctx 直驱（方 label / line 双通道分别记录——标签与提示行断言各自可判）。 */
function ctxFor(agent, lines) {
  return {
    agent,
    pushLine: (t) => lines.push({ kind: "line", text: String(t) }),
    pushLabel: (l, t) => lines.push({ kind: "label", text: `${l} ${t}` }),
  }
}
const texts = (lines) => lines.map((l) => l.text)
const labels = (lines) => lines.filter((l) => l.kind === "label").map((l) => l.text)

test("T11 拒绝：工程模式 ⇒ /plan 零翻转 + 共用文案提示行（无成功标签——防假成功）", async () => {
  const lines = []
  const agent = { config: { agent: { engineering: true } }, planMode: false }
  await handlePlanCommand(ctxFor(agent, lines))
  assert.equal(agent.planMode, false, "零翻转（不写 planMode）")
  assert.deepEqual(texts(lines), [PLAN_ENGINEERING_REFUSED], "提示行 = 共用文案常量逐字（TUI / ACP 同源）")
  assert.deepEqual(labels(lines), [], "零标签（标签 = 成功回显——同 /eng 拒翻先例）")

  // 幂等：工程态下反复发 /plan 恒不翻（半状态不产生）
  const lines2 = []
  const on = { config: { agent: { engineering: true } }, planMode: true }
  await handlePlanCommand(ctxFor(on, lines2))
  assert.equal(on.planMode, true, "既有 planMode 不被该路径改写（清零点 = 模式翻转/恢复面，非本命令）")
  assert.deepEqual(texts(lines2), [PLAN_ENGINEERING_REFUSED])
})

test("T14 普通模式零回归：/plan 照常 ON/OFF 翻转 + 既有标签/提示行逐字", async () => {
  const lines = []
  const agent = { config: { agent: {} }, planMode: false }
  await handlePlanCommand(ctxFor(agent, lines))
  assert.equal(agent.planMode, true, "普通模式 ON")
  assert.ok(labels(lines).some((l) => l.startsWith("❯ Plan")), "成功标签在位（回归）")
  assert.ok(texts(lines).some((l) => l.includes("Plan mode: ON")), "既有提示行逐字（回归）")

  await handlePlanCommand(ctxFor(agent, lines))
  assert.equal(agent.planMode, false, "普通模式 OFF")
  assert.ok(texts(lines).some((l) => l.includes("Plan mode: OFF")))
})
