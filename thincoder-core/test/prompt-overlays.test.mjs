/**
 * prompt-overlays.test.mjs — 槽位装配（核内单一实现；CORE-UNIFICATION S0a ·
 * 来源 = 两产品同名对，取 CLI 侧；槽位解析经核内单一解析面 prompt-files.mjs——D-C13）。
 * 行为面：槽位常量加载 · 装配固定序（persona → common → discipline）·
 * 缺档 SKIPPED + 警告（无跨槽回退）· consult 场景走自含基底。
 *
 * ⚠ S1：核内槽位已补齐（S0a 12 + discipline-* / persona-eng-coder 3）——八个场景均**在位**；
 * 「缺档 ⇒ 静默跳过 + 警告」契约仍按合成场景锁住（缺档语义按调用方保留，契约 9）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import {
  COMMON,
  CONSULT_BASE,
  DISCIPLINE_ENGINEERING,
  DISCIPLINE_NORMAL,
  PERSONA_ENGINEERING,
  SCENARIO_SLOT_FILES,
  assemblePrompt,
  slotWarning,
} from "../prompt-overlays.mjs"

test("S1 core carries the full slot contents", () => {
  assert.ok(PERSONA_ENGINEERING.length > 0)
  assert.ok(COMMON.length > 0)
  assert.ok(CONSULT_BASE.length > 0)
  assert.ok(DISCIPLINE_ENGINEERING.length > 0)
  assert.ok(DISCIPLINE_NORMAL.length > 0)
})

test("every scenario assembles with no warnings now that the slots are complete (T-C8)", () => {
  for (const scenario of ["engineering", "normal", "eng-coder", "eng-designer", "explore", "coder", "plan"]) {
    const { warnings } = assemblePrompt(scenario)
    assert.deepEqual(warnings, [], `${scenario}: ${warnings.join(" | ")}`)
  }
})

test("assemblePrompt joins the present slots in the fixed order", () => {
  const { prompt } = assemblePrompt("engineering")
  assert.ok(prompt.startsWith(PERSONA_ENGINEERING), "persona first")
  assert.ok(prompt.indexOf(COMMON) > 0, "common after persona")
})

test("a missing slot is SKIPPED with a warning — no fallback from another slot", () => {
  // Synthetic scenario: the warning branch must stay locked even though every shipped slot is present.
  SCENARIO_SLOT_FILES.__test_missing__ = ["persona-engineering.md", "no-such-slot.md"]
  try {
    const { warnings, prompt } = assemblePrompt("__test_missing__")
    assert.ok(warnings.some((w) => w.includes("no-such-slot.md")))
    assert.ok(warnings.every((w) => w.includes("SKIPPED")))
    assert.ok(!prompt.includes("no-such-slot.md"))
    assert.ok(prompt.includes(PERSONA_ENGINEERING), "the present slot still assembles")
  } finally {
    delete SCENARIO_SLOT_FILES.__test_missing__
  }
})

test("unknown / consult scenario falls back to the consult base with no warnings", () => {
  const r = assemblePrompt("consult")
  assert.equal(r.prompt, CONSULT_BASE)
  assert.deepEqual(r.warnings, [])
})

test("slotWarning names the missing file", () => {
  assert.ok(slotWarning("x.md").includes("x.md"))
  assert.ok(slotWarning("x.md").includes("[System reminder:"))
})

test("SCENARIO_SLOT_FILES covers the eight scenarios", () => {
  assert.deepEqual(Object.keys(SCENARIO_SLOT_FILES).sort(), [
    "coder",
    "consult",
    "eng-coder",
    "eng-designer",
    "engineering",
    "explore",
    "normal",
    "plan",
  ])
})
