/**
 * math.mjs tests — LaTeX → Unicode approximation + conversation-render wiring (IK9IXD).
 */
import { test } from "node:test"
import assert from "node:assert/strict"

import { renderMathInline, renderMathBlock, convertFormula } from "../src/tui/math.mjs"
import { buildConvLines } from "../src/tui/render-conversation.mjs"

test("convertFormula: superscript / subscript / greek / fraction", () => {
  assert.equal(convertFormula("x^2 + y_i"), "x² + yᵢ")
  assert.equal(convertFormula("\\alpha + \\beta"), "α + β")
  assert.equal(convertFormula("\\frac{a}{b}"), "(a)/(b)")
  assert.equal(convertFormula("\\sum_i"), "∑ᵢ")
})

test("renderMathInline converts closed $...$ spans", () => {
  assert.equal(renderMathInline("result: $x^2$"), "result: x²")
  assert.equal(renderMathInline("a $\\alpha$ b"), "a α b")
})

test("renderMathBlock converts closed $$...$$ spans", () => {
  assert.equal(renderMathBlock("$$\\frac{a}{b}$$"), "(a)/(b)")
})

test("unclosed math stays verbatim (streaming safety)", () => {
  assert.equal(renderMathInline("open $x^2"), "open $x^2")
  assert.equal(renderMathBlock("open $$x^2"), "open $$x^2")
})

test("inline math is wired into conversation rendering", () => {
  const state = {
    lines: [{ text: "result: $x^2$", color: "" }],
    streaming: "",
    reasoning: "",
    search: null,
    foldEnabled: true,
    expandedBlocks: new Set(),
    _advisorBlocks: [],
  }
  const rendered = buildConvLines(state, 80).map((l) => l.text).join("\n")
  assert.ok(!rendered.includes("$x^2"), `raw math not converted: ${rendered}`)
  assert.ok(rendered.includes("x²"), `expected x², got: ${rendered}`)
})