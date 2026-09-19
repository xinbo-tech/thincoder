/**
 * cmd-eng.test.mjs — PORTABILITY 批（FR10–FR15 · CLI 面）面① `/eng` + 文案契约
 * 用例表 T-18 / T-19（PO-11）；#41 增补 T-20–T-22（先判后翻 / 拒翻零标签 / OFF 恒放行——
 * docs/core/design/MANIFEST.md §2.8 F2/F3 · AC-20 · 批档 §2.3 AC-C）。
 *
 * 断言对象 = src/tui/cmd-eng.mjs（/eng 无**已退役概念前提**切换——FR11 收正口径 = 不要
 * 求方法论文档 / 文档树；仓根锚（git）= E2 既有入口前提）。构造手法：ctx 直驱
 * （slash-commands 的调用形态）+ sessions 目录隔离缝；showPicker 传"会炸的探针"——
 * 旧门禁若复活（要求 METHODOLOGY.md）即红。
 * 夹具（#41）：`tmp` = 仓根（`.git`——ON 判据锚）；非锚格 = 临时纯目录。
 */
import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { handleEngCommand } from "../src/tui/cmd-eng.mjs"
import { ENG_OFF_REMINDER } from "@thincoder/core/agent.mjs"
import { MANIFEST_REL } from "@thincoder/core/manifest.mjs"
import { _setSessionsDirForTest, _resetSessionsDirForTest } from "@thincoder/core/session-slots.mjs"

let tmp, sessionsDir
beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), "portability-eng-")) // 空项目：无 METHODOLOGY.md / 无 docs 树
  // #41：ON 判据锚 = 仓根（.git——E2 既有入口前提）；非锚格另行建纯目录。
  mkdirSync(join(tmp, ".git"), { recursive: true })
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
  assert.equal(agent.config.agent.engineering, true, "无已退役概念前提切换成功")
  assert.ok(agent.manifest, "ON 准 ⇒ 附着（缺档格就地建档——AC-20②）")
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

// ─── #41：先判后翻（ON）/ 拒翻零标签 / OFF 恒放行（AC-C · AC-20）───────────────────

/** 非锚 cwd（无 .git ∧ 向下零个带 manifest 子仓 ⇒ 根不可解析）。 */
function mkPlainDir() {
  return mkdtempSync(join(tmpdir(), "portability-eng-plain-"))
}

test("T-20 错误：非锚 cwd 上 ON ⇒ 拒翻——warn 行 + 零标签 + 零副作用", async () => {
  const plain = mkPlainDir()
  try {
    const lines = []
    const agent = engAgent({ cwd: plain, _advisorRuns: new Map([["x", {}]]), _lastEngState: false })
    await handleEngCommand(ctxFor(agent, lines))
    assert.notEqual(agent.config.agent.engineering, true, "模式未翻（fail-closed 拒翻）")
    assert.equal(agent.manifest ?? null, null, "不附着")
    assert.equal(agent._advisorRuns.size, 1, "_advisorRuns 未重置（先判后翻零副作用）")
    assert.equal(agent._pendingReminders.length, 0, "提醒未入列")
    assert.ok(!lines.some((l) => l.includes("❯ Eng")), "拒时零标签（标签 = 成功回显——防假成功）")
    assert.ok(lines.some((l) => l.includes("Engineering mode not enabled")), "warn 行在场")
    assert.ok(lines.some((l) => l.includes("工程模式启动拒绝") && l.includes("(mode unchanged)")), "原因句 = 入口门槛原句")
    assert.equal(existsSync(join(plain, MANIFEST_REL)), false, "不自动建档")
  } finally { rmSync(plain, { recursive: true, force: true }) }
})

test("T-21 错误：仓根档非法 ⇒ 拒翻——fail-closed 原因句 + 零标签", async () => {
  writeFileSync(join(tmp, MANIFEST_REL), "{ this is not valid json")
  const lines = []
  const agent = engAgent()
  await handleEngCommand(ctxFor(agent, lines))
  assert.notEqual(agent.config.agent.engineering, true, "模式未翻")
  assert.ok(!lines.some((l) => l.includes("❯ Eng")), "零标签")
  assert.ok(lines.some((l) => l.includes("fail-closed") && l.includes("(mode unchanged)")), "原因句在场")
})

test("T-22 边界：OFF 方向恒放行（非锚 cwd 亦不拦——F2 表 OFF 行）", async () => {
  const plain = mkPlainDir()
  try {
    const lines = []
    const agent = engAgent({ cwd: plain, config: { agent: { engineering: true } } })
    await handleEngCommand(ctxFor(agent, lines))
    assert.equal(agent.config.agent.engineering, false, "OFF 恒放行（零 manifest I/O）")
    assert.ok(lines.some((l) => l.includes("❯ Eng")), "OFF 走既有成功回显（标签）")
    assert.ok(lines.some((l) => l.includes("Engineering mode: OFF")))
  } finally { rmSync(plain, { recursive: true, force: true }) }
})
