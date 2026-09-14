/**
 * cmd-eng.test.mjs — PORTABILITY 批（FR10–FR15 · CLI 面）面① `/eng` + 文案契约
 * 用例表 T-18 / T-19（PO-11）。
 *
 * 断言对象 = src/tui/cmd-eng.mjs（/eng 无前提切换）。构造手法：ctx 直驱
 * （slash-commands 的调用形态）+ sessions 目录隔离缝；showPicker 传"会炸的探针"——
 * 旧门禁若复活（要求 METHODOLOGY.md）即红。
 */
import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { handleEngCommand } from "../src/tui/cmd-eng.mjs"
import { ENG_OFF_REMINDER } from "../src/agent.mjs"
import { _setSessionsDirForTest, _resetSessionsDirForTest } from "@thincoder/core/session-slots.mjs"

let tmp, sessionsDir
beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), "portability-eng-")) // 空项目：无 METHODOLOGY.md / 无 docs 树 / 无 git
  sessionsDir = mkdtempSync(join(tmpdir(), "portability-eng-sess-"))
  _setSessionsDirForTest(sessionsDir)
})
afterEach(() => {
  _resetSessionsDirForTest()
  rmSync(tmp, { recursive: true, force: true })
  rmSync(sessionsDir, { recursive: true, force: true })
})

/** ctx 直驱（showPicker = 探针：被调用即抛——"不弹窗"的机械证明）。 */
function ctxFor(agent, lines) {
  return {
    agent,
    pushLine: (t) => lines.push(String(t)),
    pushLabel: (l, t) => lines.push(`${l} ${t}`),
    showPicker: async () => { throw new Error("picker must not open (no prerequisite dialog)") },
  }
}
const engAgent = (over = {}) => ({
  cwd: tmp, config: { agent: {} }, _advisorRuns: new Map(), _pendingReminders: [], ...over,
})

test("T-18 正常：空项目（无 METHODOLOGY.md）→ 不弹窗、不崩；Engineering mode: ON", async () => {
  const lines = []
  const agent = engAgent()
  await handleEngCommand(ctxFor(agent, lines))
  assert.equal(agent.config.agent.engineering, true, "无前提切换成功")
  assert.ok(lines.some((l) => l.includes("Engineering mode: ON")), "ON 提示行在场")
  assert.ok(lines.some((l) => l.includes("design-before-code enforced")), "新提示文案在场（去 strictly following）")
  assert.ok(!lines.some((l) => l.includes("strictly following")), "旧提示文案零残留")
  assert.ok(!lines.some((l) => l.includes("METHODOLOGY")), "METHODOLOGY 文案零残留")
  assert.ok(!lines.some((l) => l.includes("Created METHODOLOGY.md")), "模板创建分支已删")
})

test("T-19 边界：OFF 切换 → 提醒推入 + 令牌语义保持（快照断言）", async () => {
  const lines = []
  const live = "tok-id:2999-01-01"
  const agent = engAgent({ _engDesignTokens: new Map([["did-live", live]]) })
  await handleEngCommand(ctxFor(agent, lines)) // OFF → ON
  assert.equal(agent.config.agent.engineering, true)
  assert.deepEqual([...agent._pendingReminders], [], "ON 不推 OFF 提醒")
  assert.deepEqual([...agent._engDesignTokens], [["did-live", live]], "ON 后 token 原样（有效保留）")
  agent._advisorRuns = new Map([["x", {}]])
  await handleEngCommand(ctxFor(agent, lines)) // ON → OFF
  assert.equal(agent.config.agent.engineering, false)
  assert.deepEqual([...agent._pendingReminders], [ENG_OFF_REMINDER], "OFF 提醒推入")
  assert.deepEqual([...agent._engDesignTokens], [["did-live", live]], "OFF 不清 token（R16）")
  assert.equal(agent._advisorRuns.size, 0, "per-review 实例随模式清空（D-24b）")
  assert.ok(lines.some((l) => l.includes("Engineering mode: OFF")), "OFF 提示行在场")
})
