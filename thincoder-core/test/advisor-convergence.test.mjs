/**
 * advisor-convergence.test.mjs — convergence 轮次消息构建（核内单一实现；
 * CORE-UNIFICATION S0a · 来源 = 两产品同名对，取 CLI 侧 + 注释端名订正）。
 * 行为面：轮次语义（round 2 可报新问题 / round 3+ 只验旧表）· scope 面截断 ·
 * body 结构（先验输出逐字 + agent 响应 + instructions）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { buildConvergenceInstructions, buildConvergenceBody } from "../advisor/convergence.mjs"

test("round 2 instructions allow flagging obvious new issues (7 lines)", () => {
  const lines = buildConvergenceInstructions(2)
  assert.equal(lines.length, 7)
  assert.ok(lines[6].includes("flag obvious NEW issues"))
})

test("round 3+ instructions forbid new-issue hunting", () => {
  assert.ok(buildConvergenceInstructions(3)[6].includes("Do NOT look for new issues"))
})

test("scope files ride the first instruction, capped at 10", () => {
  const files = Array.from({ length: 12 }, (_, i) => `f${i}.mjs`)
  const first = buildConvergenceInstructions(2, files)[0]
  assert.ok(first.includes("The review surface is: f0.mjs"))
  assert.ok(first.includes("f9.mjs"))
  assert.ok(!first.includes("f10.mjs"))
})

test("no scope files -> no review-surface sentence", () => {
  assert.ok(!buildConvergenceInstructions(2)[0].includes("The review surface is:"))
  assert.ok(!buildConvergenceInstructions(2, [])[0].includes("The review surface is:"))
})

test("body carries the prior review output verbatim, the response, and the instructions", () => {
  const body = buildConvergenceBody("PRIOR-OUTPUT-VERBATIM", "RESPONSE-TABLE", 2)
  assert.ok(body.startsWith("## Round 2 — Verify Prior Table + Flag New Issues"))
  assert.ok(body.includes("## Prior Review Output (verify every item it raises)"))
  assert.ok(body.includes("PRIOR-OUTPUT-VERBATIM"))
  assert.ok(body.includes("## Agent Response (fix claims — reference only)"))
  assert.ok(body.includes("RESPONSE-TABLE"))
  assert.ok(body.includes("## Instructions"))
})

test("round 3 body uses the strict-verification label and reminder", () => {
  const body = buildConvergenceBody("p", "r", 3)
  assert.ok(body.startsWith("## Round 3 — Strict Verification"))
  assert.ok(body.includes("strictly verify only the prior review output"))
})
