/**
 * tool-args.test.mjs — describeToolArgs 单行参数摘要（CODE-HARDENING-BATCH §2.4，
 * 2026-09-08）：action-only 调用（status/observe/send/cancel/escalate/consume-design…
 * 无 task）兜底显示 action——标题如 "❯ subagent (status)"。纯单元（无 io）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { describeToolArgs } from "../src/tui/tool-args.mjs"

test("2.4 action-only 调用无 task → 摘要含 (action)", () => {
  assert.equal(describeToolArgs("subagent", { action: "status" }), "(status)")
  assert.equal(describeToolArgs("subagent", { action: "cancel" }), "(cancel)")
  assert.equal(describeToolArgs("subagent", { action: "consume-design", designId: "d1" }), "(consume-design)")
})

test("2.4 有 task 时仍以 task 为准（不叠加 action）；全空回退空串", () => {
  const s = describeToolArgs("subagent", { action: "spawn", task: "Do the audit thing" })
  assert.ok(s.startsWith("Do the audit thing"), s)
  assert.ok(!s.includes("spawn"), "task present → no action fallback appended")
  assert.equal(describeToolArgs("subagent", {}), "")
  assert.equal(describeToolArgs("subagent", { task: "" }), "")
})
