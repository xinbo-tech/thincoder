/**
 * prompt-overlays.test.mjs — 槽位装配（核内单一实现；CORE-UNIFICATION S0a ·
 * 来源 = 两产品同名对，取 CLI 侧；槽位解析经核内单一解析面 prompt-files.mjs——D-C13）。
 * 行为面：槽位常量加载 · 装配固定序（persona → common → discipline）·
 * 缺档 SKIPPED + 警告（无跨槽回退）· consult 场景走自含基底。
 *
 * ⚠ S0a 核内只有 S0a 席位槽位（discipline-* / persona-eng-coder 属 S0b 席位，
 * 尚未入核）——「缺档 ⇒ 静默跳过 + 警告」正是本段要锁的契约（缺档语义按调用方保留，契约 9）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import {
  COMMON,
  CONSULT_BASE,
  PERSONA_ENGINEERING,
  SCENARIO_SLOT_FILES,
  assemblePrompt,
  slotWarning,
} from "../prompt-overlays.mjs"

test("S0a core carries the S0a seat slot contents", () => {
  assert.ok(PERSONA_ENGINEERING.length > 0)
  assert.ok(COMMON.length > 0)
  assert.ok(CONSULT_BASE.length > 0)
})

test("assemblePrompt joins the present slots in the fixed order", () => {
  const { prompt } = assemblePrompt("engineering")
  assert.ok(prompt.startsWith(PERSONA_ENGINEERING), "persona first")
  assert.ok(prompt.indexOf(COMMON) > 0, "common after persona")
})

test("a missing slot is SKIPPED with a warning — no fallback from another slot", () => {
  // discipline-engineering.md is an S0b seat — not yet in the core build.
  const { warnings, prompt } = assemblePrompt("engineering")
  assert.ok(warnings.some((w) => w.includes("discipline-engineering.md")))
  assert.ok(warnings.every((w) => w.includes("SKIPPED")))
  assert.ok(!prompt.includes("discipline-engineering.md"))
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
